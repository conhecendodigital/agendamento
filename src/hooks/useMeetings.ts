import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  participants: string[];
  participant_names: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  webhook_sent: boolean;
  google_event_id?: string;
  meet_link?: string;
}

export const useMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Load meetings
  useEffect(() => {
    const loadMeetings = async () => {
      if (isSupabaseConfigured() && supabase && user) {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (!error && data) {
          setMeetings(data);
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('valento_meetings');
        if (stored) {
          setMeetings(JSON.parse(stored));
        }
      }
      setLoading(false);
    };

    loadMeetings();
  }, [user]);

  const saveMeetingsLocal = useCallback((newMeetings: Meeting[]) => {
    setMeetings(newMeetings);
    localStorage.setItem('valento_meetings', JSON.stringify(newMeetings));
  }, []);

  const createMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id' | 'meet_link'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: crypto.randomUUID(),
      user_id: user?.id || '1',
      created_at: new Date().toISOString(),
      webhook_sent: false
    };

    if (isSupabaseConfigured() && supabase && user) {
      const { data, error } = await supabase
        .from('meetings')
        .insert(newMeeting)
        .select()
        .single();

      if (error) throw error;
      setMeetings(prev => [...prev, data]);
      return data;
    } else {
      const updated = [...meetings, newMeeting];
      saveMeetingsLocal(updated);
      return newMeeting;
    }
  }, [meetings, saveMeetingsLocal, user]);

  const updateMeeting = useCallback(async (id: string, updates: Partial<Meeting>) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setMeetings(prev => prev.map(m => m.id === id ? data : m));
      return data;
    } else {
      const updated = meetings.map(m => m.id === id ? { ...m, ...updates } : m);
      saveMeetingsLocal(updated);
      return updated.find(m => m.id === id)!;
    }
  }, [meetings, saveMeetingsLocal]);

  const deleteMeeting = useCallback(async (id: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMeetings(prev => prev.filter(m => m.id !== id));
    } else {
      const updated = meetings.filter(m => m.id !== id);
      saveMeetingsLocal(updated);
    }
  }, [meetings, saveMeetingsLocal]);

  const updateWebhookStatus = useCallback(async (id: string, sent: boolean, googleEventId?: string, meetLink?: string) => {
    const updates: Partial<Meeting> = {
      webhook_sent: sent,
      google_event_id: googleEventId,
      meet_link: meetLink
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('meetings').update(updates).eq('id', id);
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    } else {
      const updated = meetings.map(m => m.id === id ? { ...m, ...updates } : m);
      saveMeetingsLocal(updated);
    }
  }, [meetings, saveMeetingsLocal]);

  const getUpcomingMeetings = useCallback((limit: number = 5) => {
    const today = new Date().toISOString().split('T')[0];
    return meetings
      .filter(m => m.date >= today && m.status !== 'cancelled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      })
      .slice(0, limit);
  }, [meetings]);

  const getTodayMeetingsCount = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return meetings.filter(m => m.date === today && m.status !== 'cancelled').length;
  }, [meetings]);

  const getUniqueParticipantsCount = useCallback(() => {
    const allParticipants = meetings.flatMap(m => m.participants);
    return new Set(allParticipants).size;
  }, [meetings]);

  const getNextMeeting = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return meetings
      .filter(m => {
        if (m.status === 'cancelled') return false;
        if (m.date > today) return true;
        if (m.date === today && m.start_time >= currentTime) return true;
        return false;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      })[0] || null;
  }, [meetings]);

  return {
    meetings,
    loading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateWebhookStatus,
    getUpcomingMeetings,
    getTodayMeetingsCount,
    getUniqueParticipantsCount,
    getNextMeeting
  };
};
