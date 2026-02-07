export const GROK_CONFIG = {
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta',
    apiKey: import.meta.env.VITE_XAI_API_KEY,
};

export const isGrokConfigured = (): boolean => {
    return !!GROK_CONFIG.apiKey && GROK_CONFIG.apiKey !== 'undefined';
};
