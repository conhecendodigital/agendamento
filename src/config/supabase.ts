// ⚠️ CONFIGURAR: Cole suas credenciais do Supabase abaixo
// Acesse https://supabase.com, crie um projeto, e copie os valores de Settings > API

const SUPABASE_URL = "https://aoouqmbyplbmkkamqoyf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb3VxbWJ5cGxibWtrYW1xb3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzIyMDgsImV4cCI6MjA4NTk0ODIwOH0.z5Dyeyh7-5gfyx6azq2-K4QN7nfv17DAcPVklp9unaU";

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tipos para a aplicação
export interface Meeting {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    participants: string[];
    status: 'scheduled' | 'completed' | 'cancelled';
    webhook_sent: boolean;
    google_event_id: string | null;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    user_metadata: {
        full_name?: string;
    };
}
