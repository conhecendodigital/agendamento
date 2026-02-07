import type { Meeting } from '../hooks/useMeetings';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

interface WebhookResult {
  status: 'success' | 'error';
  google_event_id?: string;
  meet_link?: string; // Para receber o link do Meet
  message?: string;
}

// n8n Webhook URL
const N8N_WEBHOOK_URL = 'https://webhook.vendasvno.com/webhook/agendamentos';

export const sendWebhook = async (
  action: 'create' | 'update' | 'delete',
  meeting: Meeting,
  user: User
): Promise<WebhookResult> => {
  try {
    // Build payload for n8n webhook
    const payload = {
      action,
      meeting_id: meeting.id,
      google_event_id: meeting.google_event_id || null,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date, // format: YYYY-MM-DD
      start_time: meeting.start_time, // format: HH:MM:SS
      end_time: meeting.end_time, // format: HH:MM:SS
      participants: meeting.participants,
      participant_names: meeting.participant_names || [],
      organizer_name: user.user_metadata.full_name || 'Usuário',
      organizer_email: user.email,
      status: meeting.status,
      timezone: 'America/Sao_Paulo'
    };

    console.log('Sending webhook to n8n:', payload);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Webhook response not ok:', response.status, response.statusText);
      return {
        status: 'error',
        message: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const rawData = await response.json();
    console.log('Webhook RAW response:', JSON.stringify(rawData));

    // n8n pode retornar em vários formatos:
    // 1. Array: [{status, meet_link, ...}]
    // 2. Objeto direto: {status, meet_link, ...}
    // 3. String JSON: '{"status":"success",...}'
    // 4. Nested: {output: '{"status":"success",...}'}
    let data: any;

    if (Array.isArray(rawData)) {
      data = rawData[0];
    } else if (typeof rawData === 'string') {
      try { data = JSON.parse(rawData); } catch { data = rawData; }
    } else {
      data = rawData;
    }

    // Se data ainda tem .output como string, parse novamente
    if (data?.output && typeof data.output === 'string') {
      try {
        const parsed = JSON.parse(data.output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        data = parsed;
      } catch { /* keep data as is */ }
    }

    console.log('Webhook PARSED data:', JSON.stringify(data));
    console.log('meet_link value:', data?.meet_link);

    // Parse n8n AI Agent response
    if (data?.google_event_id || data?.status === 'success') {
      const result = {
        status: 'success' as const,
        google_event_id: data.google_event_id || data.data?.id,
        meet_link: data.meet_link || data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri,
        message: data.message || 'Event synced to Google Calendar'
      };
      console.log('Webhook FINAL result:', JSON.stringify(result));
      return result;
    }

    return {
      status: 'error',
      message: data?.message || 'Unknown error from n8n'
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to send webhook'
    };
  }
};

// Envia mensagem de chat para o AI Agent agendar via linguagem natural
export const sendChatMessage = async (
  message: string,
  user: { id: string; email: string; user_metadata: { full_name?: string } }
): Promise<WebhookResult> => {
  try {
    const payload = {
      action: 'chat',
      message,
      organizer_name: user.user_metadata.full_name || 'Usuário',
      organizer_email: user.email,
      timezone: 'America/Sao_Paulo',
      current_date: new Date().toISOString().split('T')[0],
      current_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    console.log('Sending chat message to n8n:', payload);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { status: 'error', message: `HTTP error: ${response.status}` };
    }

    const rawData = await response.json();
    console.log('Chat RAW response:', JSON.stringify(rawData));

    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    // Se data.output é string, tenta parsear
    if (data?.output && typeof data.output === 'string') {
      try {
        const parsed = JSON.parse(data.output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        return {
          status: parsed.status || 'success',
          google_event_id: parsed.google_event_id,
          meet_link: parsed.meet_link,
          message: parsed.message || 'Evento processado com sucesso',
        };
      } catch { /* continue with data as-is */ }
    }

    return {
      status: data?.status || 'success',
      google_event_id: data?.google_event_id,
      meet_link: data?.meet_link || data?.hangoutLink,
      message: data?.message || 'Evento processado com sucesso',
    };
  } catch (error) {
    console.error('Chat webhook error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
};
