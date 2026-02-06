import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { Meeting } from '../config/supabase';
import { useAuth } from './useAuth';

export const useMeetings = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    // Buscar reuniões do usuário
    const fetchMeetings = useCallback(async () => {
        if (!user) {
            setMeetings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Erro ao buscar reuniões:', error);
            setMeetings([]);
        } else {
            setMeetings(data || []);
        }
        setLoading(false);
    }, [user]);

    // Carregar reuniões quando o usuário mudar
    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    // Criar nova reunião
    const createMeeting = useCallback(async (meeting: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id'>) => {
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('meetings')
            .insert({
                ...meeting,
                user_id: user.id,
                webhook_sent: false,
                google_event_id: null,
            })
            .select()
            .single();

        if (error) throw error;

        // Atualizar lista local
        await fetchMeetings();

        return data as Meeting;
    }, [user, fetchMeetings]);

    // Atualizar reunião
    const updateMeeting = useCallback(async (id: string, updates: Partial<Meeting>) => {
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Atualizar lista local
        await fetchMeetings();

        return data as Meeting;
    }, [fetchMeetings]);

    // Deletar reunião
    const deleteMeeting = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Atualizar lista local
        await fetchMeetings();
    }, [fetchMeetings]);

    // Atualizar status do webhook
    const updateWebhookStatus = useCallback(async (id: string, webhookSent: boolean, googleEventId?: string | null) => {
        const updates: Partial<Meeting> = { webhook_sent: webhookSent };
        if (googleEventId !== undefined) {
            updates.google_event_id = googleEventId;
        }

        return updateMeeting(id, updates);
    }, [updateMeeting]);

    // Obter reuniões de um dia específico
    const getMeetingsByDate = useCallback((dateStr: string) => {
        return meetings.filter(m => m.date === dateStr);
    }, [meetings]);

    // Obter próximas reuniões
    const getUpcomingMeetings = useCallback((limit: number = 5) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const now = today.toTimeString().slice(0, 5);

        return meetings
            .filter(m => {
                if (m.status === 'cancelled') return false;
                if (m.date > todayStr) return true;
                if (m.date === todayStr && m.start_time > now) return true;
                return false;
            })
            .slice(0, limit);
    }, [meetings]);

    // Contar reuniões de hoje
    const getTodayMeetingsCount = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return meetings.filter(m => m.date === today && m.status !== 'cancelled').length;
    }, [meetings]);

    // Contar participantes únicos
    const getUniqueParticipantsCount = useCallback(() => {
        const allParticipants = meetings.flatMap(m => m.participants);
        return new Set(allParticipants).size;
    }, [meetings]);

    // Obter próxima reunião
    const getNextMeeting = useCallback(() => {
        const upcoming = getUpcomingMeetings(1);
        return upcoming[0] || null;
    }, [getUpcomingMeetings]);

    return {
        meetings,
        loading,
        fetchMeetings,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        updateWebhookStatus,
        getMeetingsByDate,
        getUpcomingMeetings,
        getTodayMeetingsCount,
        getUniqueParticipantsCount,
        getNextMeeting,
    };
};

export default useMeetings;
