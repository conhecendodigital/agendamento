import { GROK_CONFIG, isGrokConfigured } from '../config/grok';
import type { ParsedMeeting } from '../utils/meetingParser';
import { formatContactsForPrompt } from '../utils/agentMemory';

interface GrokMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GrokResponse {
    choices: Array<{
        message: { role: string; content: string };
        finish_reason: string;
    }>;
}

/**
 * Response from Grok can be either:
 * - A conversational message (asking for more info)
 * - A structured meeting JSON (when all data is collected)
 */
export interface GrokResult {
    type: 'message' | 'meeting';
    message?: string;           // Conversational response text
    meeting?: ParsedMeeting;    // Structured meeting data when ready
}

const SYSTEM_PROMPT = `Você é um assistente de agendamento de reuniões da Valento Academy, simpático e profissional.
Você conversa naturalmente em português brasileiro para coletar dados de reuniões.

## Contexto
- Data de hoje: {TODAY_DATE}
- Dia da semana: {TODAY_WEEKDAY}
- Hora atual: {CURRENT_TIME}
- Fuso: America/Sao_Paulo

## Seu Objetivo
Coletar TODAS as informações necessárias para agendar uma reunião:
1. **Participante(s)**: email obrigatório + nome
2. **Data**: quando será a reunião
3. **Horário**: início (e fim, ou assume 1h)
4. **Título/Assunto**: sobre o quê
5. **Descrição**: breve descrição do objetivo

## Como Conversar
- Seja simpático, use emojis moderadamente
- Pergunte as informações que faltam de forma natural, uma ou duas por vez
- Entenda referências como "amanhã", "segunda", "próxima semana", "dia 15"
- Se o usuário der várias informações de uma vez, ótimo! Aproveite tudo.
- Confirme o que entendeu quando receber informações parciais
- NÃO peça todas as informações de uma vez, seja conversacional

## Regras
- "amanhã" = {TOMORROW_DATE}
- "segunda", "terça", etc = próxima ocorrência
- Se só horário de início, assume 1h de duração
- Se email informado sem nome, infira do email (joao.silva@ → João Silva)
- Se nome informado sem email, peça o email

## FORMATO DE RESPOSTA

Você DEVE escolher UM dos dois formatos abaixo:

### Formato 1: Conversa (quando ainda faltam dados)
Responda naturalmente em texto, sem JSON, perguntando o que falta.

### Formato 2: Dados completos (quando tem TUDO)
Quando tiver email, data, horário, título E descrição, responda SOMENTE com este JSON:

\`\`\`json
{
  "ready": true,
  "title": "Título da reunião",
  "participants": ["email@exemplo.com"],
  "participant_names": ["Nome Pessoa"],
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM:SS",
  "end_time": "HH:MM:SS",
  "description": "Descrição breve da reunião",
  "dateLabel": "Amanhã (08/02)",
  "confidence": 0.95,
  "missing": []
}
\`\`\`

IMPORTANTE:
- Só use o Formato 2 quando tiver TODOS os campos preenchidos
- participants e participant_names devem ter o mesmo tamanho
- Datas no ISO (YYYY-MM-DD), horários com segundos (HH:MM:SS)
- Se o usuário confirmar dados que você resumiu, aí sim envie o JSON final`;

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export class GrokService {
    private static failureCount = 0;
    private static readonly MAX_FAILURES = 3;
    private static lastFailureTime: number | null = null;

    private static getSystemPrompt(): string {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const fmt = (d: Date) => d.toISOString().split('T')[0];
        const fmtBR = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

        return SYSTEM_PROMPT
            .replace(/{TODAY_DATE}/g, `${fmt(today)} (${fmtBR(today)})`)
            .replace(/{TODAY_WEEKDAY}/g, WEEKDAYS[today.getDay()])
            .replace(/{CURRENT_TIME}/g, today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            .replace(/{TOMORROW_DATE}/g, `${fmt(tomorrow)} (${fmtBR(tomorrow)})`)
            + formatContactsForPrompt();
    }

    /**
     * Send a message in a multi-turn conversation.
     * Returns either a text response or structured meeting data.
     */
    static async chat(
        history: GrokMessage[],
        userMessage: string
    ): Promise<GrokResult> {
        if (!isGrokConfigured()) {
            throw new Error('Grok API key não configurada');
        }

        // If in cooldown, throw to trigger fallback
        if (
            this.failureCount >= this.MAX_FAILURES &&
            this.lastFailureTime &&
            Date.now() - this.lastFailureTime < 60_000
        ) {
            throw new Error('Grok em cooldown');
        }

        const messages: GrokMessage[] = [
            { role: 'system', content: this.getSystemPrompt() },
            ...history,
            { role: 'user', content: userMessage },
        ];

        try {
            const response = await fetch(GROK_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_CONFIG.apiKey}`,
                },
                body: JSON.stringify({
                    model: GROK_CONFIG.model,
                    messages,
                    temperature: 0.6,
                    max_tokens: 800,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Grok ${response.status}: ${errText}`);
            }

            const data: GrokResponse = await response.json();
            const content = data.choices[0]?.message?.content;

            if (!content) throw new Error('Resposta vazia');

            // Reset failures on success
            this.failureCount = 0;
            this.lastFailureTime = null;

            // Try to parse as JSON meeting data
            return this.parseResponse(content);

        } catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();
            throw error;
        }
    }

    /**
     * Parse Grok response — could be conversational text or JSON meeting data
     */
    private static parseResponse(content: string): GrokResult {
        // Check if response contains JSON
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
            content.match(/(\{[\s\S]*"ready"\s*:\s*true[\s\S]*\})/);

        if (jsonMatch) {
            try {
                const cleaned = jsonMatch[1].trim();
                const parsed = JSON.parse(cleaned);

                if (parsed.ready === true && parsed.date && parsed.start_time && parsed.participants?.length > 0) {
                    // Ensure arrays match
                    const participants: string[] = parsed.participants || [];
                    const participant_names: string[] = parsed.participant_names || [];
                    while (participant_names.length < participants.length) {
                        const email = participants[participant_names.length];
                        participant_names.push(
                            email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                        );
                    }

                    return {
                        type: 'meeting',
                        meeting: {
                            title: parsed.title || 'Reunião',
                            participants,
                            participant_names,
                            date: parsed.date,
                            start_time: parsed.start_time,
                            end_time: parsed.end_time || this.addOneHour(parsed.start_time),
                            description: parsed.description || `Reunião sobre ${parsed.title}`,
                            ready: true,
                            missing: [],
                            dateLabel: parsed.dateLabel || '',
                            confidence: parsed.confidence ?? 0.9,
                        },
                    };
                }
            } catch {
                // JSON parse failed — treat as regular message
            }
        }

        // It's a conversational response
        return {
            type: 'message',
            message: content.replace(/```json[\s\S]*?```/g, '').trim() || content,
        };
    }

    private static addOneHour(time: string): string {
        const [h, m, s] = time.split(':').map(Number);
        return `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${(s || 0).toString().padStart(2, '0')}`;
    }

    /**
     * Get the conversation history format for storing
     */
    static toHistoryMessage(role: 'user' | 'assistant', content: string): GrokMessage {
        return { role, content };
    }
}
