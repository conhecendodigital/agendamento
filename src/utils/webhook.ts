import { WEBHOOK_URL } from '../config/webhook';
import type { Meeting, User } from '../config/supabase';

export interface WebhookPayload {
    action: 'create' | 'update' | 'cancel' | 'delete';
    meeting_id: string;
    google_event_id: string | null;
    title: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    participants: string[];
    organizer_name: string;
    organizer_email: string;
    status: string;
    created_at: string;
    timezone: string;
}

export interface WebhookResponse {
    google_event_id: string | null;
    status: 'success' | 'error';
    message: string;
}

export const sendWebhook = async (
    action: WebhookPayload['action'],
    meeting: Meeting,
    user: User
): Promise<WebhookResponse> => {
    // Verificar se a URL do webhook foi configurada
    if (WEBHOOK_URL === "COLE_A_URL_DO_SEU_WEBHOOK_N8N_AQUI") {
        console.warn("⚠️ Webhook n8n não configurado. Pulando envio...");
        return {
            google_event_id: null,
            status: 'error',
            message: 'Webhook não configurado',
        };
    }

    const payload: WebhookPayload = {
        action,
        meeting_id: meeting.id,
        google_event_id: meeting.google_event_id,
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        participants: meeting.participants,
        organizer_name: user.user_metadata.full_name || 'Usuário',
        organizer_email: user.email,
        status: meeting.status,
        created_at: meeting.created_at,
        timezone: 'America/Sao_Paulo',
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return {
            google_event_id: data.google_event_id || null,
            status: data.status || 'success',
            message: data.message || 'Webhook enviado com sucesso',
        };
    } catch (error) {
        console.error('Erro ao enviar webhook:', error);
        return {
            google_event_id: null,
            status: 'error',
            message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
        };
    }
};

export default sendWebhook;
