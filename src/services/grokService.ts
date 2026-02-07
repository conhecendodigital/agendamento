import { GROK_CONFIG, isGrokConfigured } from '../config/grok';
import { parseMeetingFromText, type ParsedMeeting } from '../utils/meetingParser';

interface GrokMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GrokResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

const SYSTEM_PROMPT = `Você é um assistente de agendamento de reuniões especializado em português brasileiro.

Sua tarefa é extrair informações de reuniões a partir de mensagens em linguagem natural e retornar um JSON estruturado.

## Informações do Contexto Atual
- Data de hoje: {TODAY_DATE}
- Hora atual: {CURRENT_TIME}
- Fuso horário: America/Sao_Paulo (BRT/BRST)

## Regras de Extração

### 1. PARTICIPANTES
- Extrair emails e nomes sempre que possível
- Formatos aceitos:
  - "com João Silva joao@email.com"
  - "João Silva (joao@email.com)"
  - "joao@email.com"
- Se apenas email, inferir nome da parte antes do @
- Se apenas nome fornecido sem email, marcar como missing

### 2. DATA
Resolver referências relativas a partir de HOJE ({TODAY_DATE}):
- "hoje" → data de hoje
- "amanhã" → hoje + 1 dia
- "depois de amanhã" → hoje + 2 dias
- "segunda", "terça", etc → próxima ocorrência desse dia da semana
- "próxima segunda" → próxima segunda-feira
- "dia 15/02" ou "15/02/2026" → interpretar corretamente
- Se data no passado, assumir próximo ano

### 3. HORÁRIO
- "14h" → 14:00:00-15:00:00 (assumir 1h de duração)
- "14h às 16h" → 14:00:00-16:00:00
- "14:30" → 14:30:00-15:30:00
- Se apenas horário de início, assumir 1h de duração
- Formato: HH:MM:SS

### 4. TÍTULO/ASSUNTO
- Extrair de: "sobre X", "assunto: X", "reunião de X", "call sobre X"
- Se não especificado, usar "Reunião"

### 5. DESCRIÇÃO
- Gerar descrição baseada no título e participantes

## Formato de Resposta

SEMPRE retorne APENAS um objeto JSON válido (sem markdown, sem comentários):

{
  "title": "string",
  "participants": ["email1@...", "email2@..."],
  "participant_names": ["Nome 1", "Nome 2"],
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM:SS",
  "end_time": "HH:MM:SS",
  "description": "string",
  "ready": boolean,
  "missing": ["campo1"],
  "dateLabel": "string legível (ex: Amanhã (08/02))",
  "confidence": 0.0-1.0
}

### Campo "missing" possíveis:
- "email do participante"
- "data da reunião"
- "horário"

### Campo "ready"
- true: todos os campos necessários foram extraídos (email, data, horário)
- false: falta alguma informação

### Campo "confidence"
- 0.8-1.0: alta confiança
- 0.5-0.7: média confiança
- <0.5: baixa confiança

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Datas no formato ISO (YYYY-MM-DD)
- Horários com segundos (HH:MM:SS)
- participants e participant_names devem ser arrays do mesmo tamanho
- Se tiver dúvida, marque ready=false e liste em missing`;

export class GrokService {
    private static failureCount = 0;
    private static readonly MAX_FAILURES = 3;
    private static lastFailureTime: number | null = null;

    private static getSystemPrompt(): string {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentTime = today.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return SYSTEM_PROMPT
            .replace(/{TODAY_DATE}/g, todayStr)
            .replace(/{CURRENT_TIME}/g, currentTime);
    }

    /**
     * Call Grok API directly. Throws on failure.
     */
    static async parseMeeting(userMessage: string): Promise<ParsedMeeting> {
        if (!isGrokConfigured()) {
            throw new Error('Grok API key não configurada');
        }

        const response = await fetch(GROK_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_CONFIG.apiKey}`,
            },
            body: JSON.stringify({
                model: GROK_CONFIG.model,
                messages: [
                    { role: 'system', content: this.getSystemPrompt() } as GrokMessage,
                    { role: 'user', content: userMessage } as GrokMessage,
                ],
                temperature: 0.3,
                max_tokens: 1000,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Grok API ${response.status}: ${errorText}`);
        }

        const data: GrokResponse = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Resposta vazia da Grok');
        }

        // Clean possible markdown fences
        const cleaned = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);

        // Ensure arrays exist and match
        const participants: string[] = parsed.participants || [];
        const participant_names: string[] = parsed.participant_names || [];

        // Pad names if shorter than participants
        while (participant_names.length < participants.length) {
            const email = participants[participant_names.length];
            participant_names.push(
                email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            );
        }

        return {
            title: parsed.title || 'Reunião',
            participants,
            participant_names,
            date: parsed.date || '',
            start_time: parsed.start_time || '',
            end_time: parsed.end_time || '',
            description: parsed.description || `Reunião sobre ${parsed.title || 'assunto'}`,
            ready: !!parsed.ready,
            missing: parsed.missing || [],
            dateLabel: parsed.dateLabel || '',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        };
    }

    /**
     * Try Grok first, fall back to local parser on failure.
     * Includes cooldown after repeated failures.
     */
    static async parseMeetingWithFallback(
        userMessage: string
    ): Promise<{ result: ParsedMeeting; usedGrok: boolean }> {

        // If not configured, go straight to local
        if (!isGrokConfigured()) {
            return { result: parseMeetingFromText(userMessage), usedGrok: false };
        }

        // If Grok failed too many times recently, cooldown for 1 minute
        if (
            this.failureCount >= this.MAX_FAILURES &&
            this.lastFailureTime &&
            Date.now() - this.lastFailureTime < 60_000
        ) {
            console.warn('🔄 Grok em cooldown, usando parser local');
            return { result: parseMeetingFromText(userMessage), usedGrok: false };
        }

        try {
            const startTime = Date.now();
            const result = await this.parseMeeting(userMessage);
            console.log(`✅ Grok OK (${Date.now() - startTime}ms)`, result);

            // Reset failure counter on success
            this.failureCount = 0;
            this.lastFailureTime = null;

            return { result, usedGrok: true };
        } catch (error) {
            console.error('❌ Grok falhou, fallback local:', error);

            this.failureCount++;
            this.lastFailureTime = Date.now();

            return { result: parseMeetingFromText(userMessage), usedGrok: false };
        }
    }
}
