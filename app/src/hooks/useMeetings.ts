import { useState, useEffect, useCallback } from 'react';

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  participants: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  webhook_sent: boolean;
  google_event_id?: string;
}

// Sample meetings for demo
const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: '1',
    user_id: '1',
    title: 'Daily Standup',
    description: 'Daily team sync meeting',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00:00',
    end_time: '09:30:00',
    participants: ['john@example.com', 'jane@example.com'],
    status: 'scheduled',
    created_at: new Date().toISOString(),
    webhook_sent: true,
    google_event_id: 'evt_123'
  },
  {
    id: '2',
    user_id: '1',
    title: 'Product Review',
    description: 'Quarterly product review',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '14:00:00',
    end_time: '15:30:00',
    participants: ['team@example.com'],
    status: 'scheduled',
    created_at: new Date().toISOString(),
    webhook_sent: false
  },
  {
    id: '3',
    user_id: '1',
    title: 'Client Meeting',
    description: 'Discussion with new client',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    start_time: '10:00:00',
    end_time: '11:00:00',
    participants: ['client@example.com', 'sales@example.com'],
    status: 'scheduled',
    created_at: new Date().toISOString(),
    webhook_sent: true,
    google_event_id: 'evt_456'
  }
];

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage or use sample data
    const stored = localStorage.getItem('valento_meetings');
    if (stored) {
      setMeetings(JSON.parse(stored));
    } else {
      setMeetings(SAMPLE_MEETINGS);
      localStorage.setItem('valento_meetings', JSON.stringify(SAMPLE_MEETINGS));
    }
    setLoading(false);
  }, []);

  const saveMeetings = useCallback((newMeetings: Meeting[]) => {
    setMeetings(newMeetings);
    localStorage.setItem('valento_meetings', JSON.stringify(newMeetings));
  }, []);

  const createMeeting = useCallback(async (meetingData: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: Date.now().toString(),
      user_id: '1',
      created_at: new Date().toISOString(),
      webhook_sent: false
    };
    const updated = [...meetings, newMeeting];
    saveMeetings(updated);
    return newMeeting;
  }, [meetings, saveMeetings]);

  const updateMeeting = useCallback(async (id: string, updates: Partial<Meeting>) => {
    const updated = meetings.map(m => m.id === id ? { ...m, ...updates } : m);
    saveMeetings(updated);
    return updated.find(m => m.id === id)!;
  }, [meetings, saveMeetings]);

  const deleteMeeting = useCallback(async (id: string) => {
    const updated = meetings.filter(m => m.id !== id);
    saveMeetings(updated);
  }, [meetings, saveMeetings]);

  const updateWebhookStatus = useCallback(async (id: string, sent: boolean, googleEventId?: string) => {
    const updated = meetings.map(m => 
      m.id === id ? { ...m, webhook_sent: sent, google_event_id: googleEventId } : m
    );
    saveMeetings(updated);
  }, [meetings, saveMeetings]);

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
