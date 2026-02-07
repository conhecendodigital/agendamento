/**
 * Agent Memory — persists conversation history and learned contacts in localStorage
 */

const HISTORY_KEY = 'grok_conversation_history';
const CONTACTS_KEY = 'grok_known_contacts';
const MAX_HISTORY_MESSAGES = 50; // Keep last 50 messages to avoid bloat

// ===== Conversation History =====

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const saveConversationHistory = (history: HistoryMessage[]): void => {
    try {
        // Keep only the last N messages
        const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.warn('Failed to save conversation history:', e);
    }
};

export const loadConversationHistory = (): HistoryMessage[] => {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as HistoryMessage[];
        // Only keep messages from the last 24h
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        return parsed.filter(m => m.timestamp > cutoff);
    } catch {
        return [];
    }
};

export const clearConversationHistory = (): void => {
    localStorage.removeItem(HISTORY_KEY);
};

// ===== Known Contacts =====

export interface KnownContact {
    email: string;
    name: string;
    meetingCount: number;
    lastUsed: number; // timestamp
}

export const saveContact = (email: string, name: string): void => {
    try {
        const contacts = loadContacts();
        const existing = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());

        if (existing) {
            existing.name = name || existing.name;
            existing.meetingCount++;
            existing.lastUsed = Date.now();
        } else {
            contacts.push({
                email: email.toLowerCase(),
                name,
                meetingCount: 1,
                lastUsed: Date.now(),
            });
        }

        localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    } catch (e) {
        console.warn('Failed to save contact:', e);
    }
};

export const saveContacts = (participants: string[], names: string[]): void => {
    participants.forEach((email, i) => {
        saveContact(email, names[i] || '');
    });
};

export const loadContacts = (): KnownContact[] => {
    try {
        const raw = localStorage.getItem(CONTACTS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as KnownContact[];
    } catch {
        return [];
    }
};

export const getTopContacts = (limit: number = 10): KnownContact[] => {
    return loadContacts()
        .sort((a, b) => b.meetingCount - a.meetingCount || b.lastUsed - a.lastUsed)
        .slice(0, limit);
};

export const formatContactsForPrompt = (): string => {
    const contacts = getTopContacts(10);
    if (contacts.length === 0) return '';

    const lines = contacts.map(c =>
        `- ${c.name} (${c.email}) — ${c.meetingCount} reunião(ões)`
    );

    return `\n\n## Contatos Conhecidos do Usuário\nO usuário já agendou reuniões com estas pessoas antes. Se ele mencionar um nome parecido, sugira o email já conhecido:\n${lines.join('\n')}`;
};

export const clearContacts = (): void => {
    localStorage.removeItem(CONTACTS_KEY);
};
