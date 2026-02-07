export const GROK_CONFIG = {
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3',
    apiKey: import.meta.env.VITE_XAI_API_KEY,
};

export const isGrokConfigured = (): boolean => {
    // In production, the API key is on the server (serverless proxy).
    // In dev, check the env var.
    if (!import.meta.env.DEV) return true;
    return !!GROK_CONFIG.apiKey && GROK_CONFIG.apiKey !== 'undefined';
};
