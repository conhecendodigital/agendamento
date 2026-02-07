import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from env (server-side, secure)
    const apiKey = process.env.VITE_XAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Grok API key not configured on server' });
    }

    try {
        const { messages, temperature, max_tokens, model } = req.body;

        const response = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'grok-3',
                messages,
                temperature: temperature ?? 0.6,
                max_tokens: max_tokens ?? 800,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Grok proxy error:', error);
        return res.status(500).json({ error: 'Internal proxy error' });
    }
}
