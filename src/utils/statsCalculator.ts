import type { Meeting } from '../hooks/useMeetings';
import { startOfWeek, endOfWeek, startOfMonth, addDays, dayNamesFull } from './dateUtils';

export interface DetailedStats {
    byStatus: {
        scheduled: number;
        completed: number;
        cancelled: number;
    };
    byPeriod: {
        thisWeek: number;
        thisMonth: number;
        nextWeek: number;
    };
    productivity: {
        totalHours: number;
        avgDuration: number;
        mostActiveDay: string;
    };
    topParticipants: Array<{
        email: string;
        name: string;
        count: number;
    }>;
}

export const calculateDetailedStats = (meetings: Meeting[]): DetailedStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // --- By Status ---
    const scheduled = meetings.filter(m => m.status === 'scheduled' && m.date >= today).length;
    const completed = meetings.filter(m => m.status === 'completed' || (m.status === 'scheduled' && m.date < today)).length;
    const cancelled = meetings.filter(m => m.status === 'cancelled').length;

    // --- By Period ---
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const next7 = addDays(now, 7);

    const thisWeek = meetings.filter(m => {
        const d = new Date(m.date + 'T12:00:00');
        return d >= weekStart && d <= weekEnd && m.status !== 'cancelled';
    }).length;

    const thisMonth = meetings.filter(m => {
        const d = new Date(m.date + 'T12:00:00');
        return d >= monthStart && m.status !== 'cancelled';
    }).length;

    const nextWeek = meetings.filter(m => {
        const d = new Date(m.date + 'T12:00:00');
        return d >= now && d <= next7 && m.status === 'scheduled';
    }).length;

    // --- Productivity ---
    const activeMeetings = meetings.filter(m => m.status !== 'cancelled');
    const totalMinutes = activeMeetings.reduce((acc, m) => {
        const [sh, sm] = m.start_time.split(':').map(Number);
        const [eh, em] = m.end_time.split(':').map(Number);
        return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);

    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const avgDuration = activeMeetings.length > 0 ? Math.round(totalMinutes / activeMeetings.length) : 0;

    // Most active day
    const dayCount: Record<string, number> = {};
    activeMeetings.forEach(m => {
        const dayIndex = new Date(m.date + 'T12:00:00').getDay();
        const dayName = dayNamesFull[dayIndex];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // --- Top Participants ---
    const participantMap: Record<string, { name: string; count: number }> = {};
    meetings.forEach(m => {
        m.participants.forEach((email, i) => {
            const name = m.participant_names?.[i] || email.split('@')[0];
            if (!participantMap[email]) {
                participantMap[email] = { name, count: 0 };
            }
            participantMap[email].count++;
        });
    });

    const topParticipants = Object.entries(participantMap)
        .map(([email, data]) => ({ email, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        byStatus: { scheduled, completed, cancelled },
        byPeriod: { thisWeek, thisMonth, nextWeek },
        productivity: { totalHours, avgDuration, mostActiveDay },
        topParticipants,
    };
};
