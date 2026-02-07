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
  message?: string;
}

export const sendWebhook = async (
  _action: 'create' | 'update' | 'delete',
  _meeting: Meeting,
  _user: User
): Promise<WebhookResult> => {
  // Simulate webhook call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate success with 90% probability
  if (Math.random() > 0.1) {
    return {
      status: 'success',
      google_event_id: `google_evt_${Date.now()}`,
      message: 'Webhook sent successfully'
    };
  }
  
  return {
    status: 'error',
    message: 'Failed to send webhook'
  };
};
