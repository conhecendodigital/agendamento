/**
 * Smart Meeting Parser — extrai dados de reunião de linguagem natural em PT-BR
 * Sem dependência de API externa — parsing local instantâneo
 */

export interface ParsedMeeting {
    title: string;
    participants: string[];
    participant_names: string[];
    date: string;           // YYYY-MM-DD
    start_time: string;     // HH:MM:SS
    end_time: string;       // HH:MM:SS
    description: string;
    ready: boolean;
    missing: string[];
    dateLabel: string;      // "Amanhã (08/02)"
    confidence: number;     // 0-1
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Extrai emails do texto
const extractEmails = (text: string): string[] => {
    const matches = text.match(EMAIL_REGEX);
    return matches ? [...new Set(matches.map(e => e.toLowerCase()))] : [];
};

// Extrai nomes associados a emails (ex: "com Thais Santos thais@email.com")
const extractParticipantNames = (text: string, emails: string[]): string[] => {
    return emails.map(email => {
        const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Padrão 1: "com [Nome] email@..." or "com o [Nome] email@..."
        // Ex: "com Thais Santos thais@email.com", "com o João joao@empresa.com"
        const pattern1 = new RegExp(
            `(?:com|para|do|da|de|e)\\s+(?:o\\s+|a\\s+)?([a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+(?:\\s+[a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\\s+(?:\\(?${escaped}\\)?)`,
            'i'
        );
        const m1 = text.match(pattern1);
        if (m1) return capitalizeWords(m1[1].trim());

        // Padrão 2: "[Nome] (email@...)" or "[Nome] <email@...>"
        const pattern2 = new RegExp(
            `([a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+(?:\\s+[a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\\s*[(<]\\s*${escaped}`,
            'i'
        );
        const m2 = text.match(pattern2);
        if (m2) return capitalizeWords(m2[1].trim());

        // Padrão 3: "com [Nome], email" ou "com [Nome] - email"
        const pattern3 = new RegExp(
            `(?:com|para)\\s+(?:o\\s+|a\\s+)?([a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+(?:\\s+[a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\\s*[,\\-]\\s*${escaped}`,
            'i'
        );
        const m3 = text.match(pattern3);
        if (m3) return capitalizeWords(m3[1].trim());

        // Padrão 4: Nome logo antes do email (qualquer case)
        const pattern4 = new RegExp(
            `([a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+(?:\\s+[a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\\s+${escaped}`,
            'i'
        );
        const m4 = text.match(pattern4);
        if (m4) {
            const name = m4[1].trim();
            const ignore = ['reunião', 'reuniao', 'agendar', 'marcar', 'call', 'meeting', 'sobre', 'assunto', 'email', 'grupo', 'mentoria'];
            if (!ignore.includes(name.toLowerCase())) return capitalizeWords(name);
        }

        // Padrão 5: Nome DEPOIS do email: "email@... Nome Sobrenome" or "email@... (Nome)"
        const pattern5 = new RegExp(
            `${escaped}\\s*\\(?\\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\\s+[a-zà-ÿA-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\\s*\\)?`,
            ''
        );
        const m5 = text.match(pattern5);
        if (m5) return capitalizeWords(m5[1].trim());

        // Fallback: humaniza a parte antes do @ (gui.devwork → Gui Devwork)
        const prefix = email.split('@')[0];
        const humanized = prefix
            .replace(/[._-]/g, ' ')
            .replace(/\d+/g, '')
            .trim();

        if (humanized.includes(' ')) {
            return humanized.replace(/\b\w/g, c => c.toUpperCase());
        }
        // Sem separadores: capitaliza apenas primeira letra
        return humanized.charAt(0).toUpperCase() + humanized.slice(1);
    });
};

const capitalizeWords = (s: string): string =>
    s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

// Resolve referências de data relativas
const resolveDate = (text: string): { date: string; label: string } | null => {
    const today = new Date();
    const lowerText = text.toLowerCase();

    // "hoje"
    if (/\bhoje\b/i.test(lowerText)) {
        return { date: fmt(today), label: `Hoje (${fmtBR(today)})` };
    }

    // "amanhã"
    if (/\bamanh[ãa]\b/i.test(lowerText)) {
        const d = addDays(today, 1);
        return { date: fmt(d), label: `Amanhã (${fmtBR(d)})` };
    }

    // "depois de amanhã"
    if (/depois\s+de\s+amanh[ãa]/i.test(lowerText)) {
        const d = addDays(today, 2);
        return { date: fmt(d), label: `Depois de amanhã (${fmtBR(d)})` };
    }

    // "próxima segunda/terça/..." or "segunda/terça/..."
    const dayNames: Record<string, number> = {
        'domingo': 0, 'segunda': 1, 'terca': 2, 'terça': 2, 'quarta': 3,
        'quinta': 4, 'sexta': 5, 'sabado': 6, 'sábado': 6
    };

    for (const [name, dayNum] of Object.entries(dayNames)) {
        const regex = new RegExp(`(?:pr[oó]xim[ao]\\s+)?${name}(?:-feira)?`, 'i');
        if (regex.test(lowerText)) {
            const d = getNextDayOfWeek(today, dayNum);
            return { date: fmt(d), label: `${capitalize(name)} (${fmtBR(d)})` };
        }
    }

    // "dia 15/02" or "15/02" or "15/02/2026"
    const dateMatch = lowerText.match(/(?:dia\s+)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : today.getFullYear();
        const d = new Date(year, month, day);
        if (d < today) d.setFullYear(d.getFullYear() + 1); // Se a data já passou, assume próximo ano
        return { date: fmt(d), label: fmtBR(d) };
    }

    return null;
};

// Extrai horário do texto
const extractTime = (text: string): { start: string; end: string } | null => {
    const lowerText = text.toLowerCase();

    // "14h às 16h" or "14h-16h" or "14:00 às 16:00"
    const rangeMatch = lowerText.match(/(\d{1,2})[h:](\d{0,2})?\s*(?:[àa]s|[-–])\s*(\d{1,2})[h:](\d{0,2})?/);
    if (rangeMatch) {
        const sh = rangeMatch[1].padStart(2, '0');
        const sm = (rangeMatch[2] || '00').padStart(2, '0');
        const eh = rangeMatch[3].padStart(2, '0');
        const em = (rangeMatch[4] || '00').padStart(2, '0');
        return { start: `${sh}:${sm}:00`, end: `${eh}:${em}:00` };
    }

    // "às 14h" or "14h" or "às 14:30" or "14h30"
    const singleMatch = lowerText.match(/(?:[àa]s?\s+)?(\d{1,2})[h:](\d{0,2})?(?:\s|$|,|\.)/);
    if (singleMatch) {
        const sh = singleMatch[1].padStart(2, '0');
        const sm = (singleMatch[2] || '00').padStart(2, '0');
        const startH = parseInt(sh);
        const endH = startH + 1;
        return { start: `${sh}:${sm}:00`, end: `${endH.toString().padStart(2, '0')}:${sm}:00` };
    }

    return null;
};

// Extrai assunto/título
const extractTitle = (text: string): string => {

    // "sobre X", "assunto: X", "tema: X", "a respeito de X"
    const subjectPatterns = [
        /(?:sobre|assunto[:\s]+|tema[:\s]+|a\s+respeito\s+de)\s+(.+?)(?:\s+com\s+|\s+dia\s+|\s+amanh[ãa]|\s+hoje|\s+[àa]s?\s+\d|\s+na\s+|\s*$)/i,
        /(?:sobre|assunto[:\s]+|tema[:\s]+)\s+(.+)/i,
    ];

    for (const pattern of subjectPatterns) {
        const match = text.match(pattern);
        if (match) {
            let title = match[1].trim();
            // Remove trailing punctuation
            title = title.replace(/[.,;:!?]+$/, '').trim();
            // Capitalize first letter
            return title.charAt(0).toUpperCase() + title.slice(1);
        }
    }

    // Fallback: se não encontrou "sobre", tenta pegar algo genérico
    // Remove emails, datas e horários do texto
    let cleaned = text
        .replace(EMAIL_REGEX, '')
        .replace(/\d{1,2}[h:]\d{0,2}/g, '')
        .replace(/(?:amanh[ãa]|hoje|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)/gi, '')
        .replace(/(?:pr[oó]xim[ao]|dia|[àa]s|com|para|quero|preciso|agendar|marcar|reuni[ãa]o|call|meeting)\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (cleaned.length > 3 && cleaned.length < 80) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return 'Reunião';
};

// === Helpers ===
const fmt = (d: Date): string => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const fmtBR = (d: Date): string => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const addDays = (d: Date, n: number): Date => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
};

const getNextDayOfWeek = (from: Date, dayOfWeek: number): Date => {
    const d = new Date(from);
    const diff = (dayOfWeek - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return d;
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// === Função principal ===
export const parseMeetingFromText = (text: string): ParsedMeeting => {
    const missing: string[] = [];

    // Extrair participantes
    const participants = extractEmails(text);
    const participant_names = extractParticipantNames(text, participants);
    if (participants.length === 0) missing.push('email do participante');

    // Extrair data
    const dateResult = resolveDate(text);
    if (!dateResult) missing.push('data da reunião');

    // Extrair horário
    const timeResult = extractTime(text);
    if (!timeResult) missing.push('horário');

    // Extrair título
    const title = extractTitle(text);

    const ready = missing.length === 0;

    return {
        title,
        participants,
        participant_names,
        date: dateResult?.date || '',
        start_time: timeResult?.start || '',
        end_time: timeResult?.end || '',
        description: `Reunião sobre ${title}`,
        ready,
        missing,
        dateLabel: dateResult?.label || '',
        confidence: ready ? 0.9 : (3 - missing.length) / 3,
    };
};

// Gera mensagem amigável pedindo informações faltantes
export const getMissingFieldsMessage = (missing: string[]): string => {
    const labels: Record<string, string> = {
        'email do participante': '📧 **Email** do(s) participante(s)',
        'data da reunião': '📅 **Data** (ex: amanhã, segunda, dia 15/02)',
        'horário': '🕐 **Horário** (ex: 14h, 10:30)',
    };

    const items = missing.map(m => labels[m] || m);
    return `Ainda preciso de:\n${items.map(i => `• ${i}`).join('\n')}\n\nComplete a informação para eu agendar! 😊`;
};
