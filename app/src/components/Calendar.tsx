import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meeting } from '../hooks/useMeetings';
import { monthNames, dayNamesShort, getCalendarDays, getWeekDays, getTimeSlots, toDateString, isToday, formatTime, formatDateFull, getTimePosition, getMeetingHeight } from '../utils/dateUtils';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarProps {
    meetings: Meeting[];
    onDateSelect: (date: Date, time?: string) => void;
    onMeetingClick: (meeting: Meeting) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ meetings, onDateSelect, onMeetingClick }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const getTitle = (): string => {
        if (viewMode === 'month') return `${monthNames[currentMonth]} ${currentYear}`;
        if (viewMode === 'week') {
            const weekDays = getWeekDays(currentDate);
            const start = weekDays[0], end = weekDays[6];
            if (start.getMonth() === end.getMonth()) return `${start.getDate()} - ${end.getDate()} de ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
            return `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
        }
        return formatDateFull(currentDate);
    };

    const meetingsByDate = useMemo(() => {
        const map: Record<string, Meeting[]> = {};
        meetings.forEach((m) => { if (!map[m.date]) map[m.date] = []; map[m.date].push(m); });
        Object.keys(map).forEach((date) => { map[date].sort((a, b) => a.start_time.localeCompare(b.start_time)); });
        return map;
    }, [meetings]);

    // Netflix Blue Status Colors
    const getStatusColor = (status: Meeting['status']) => {
        if (status === 'scheduled') return 'bg-[#0071eb]/20 border-[#0071eb] text-[#0071eb]';
        if (status === 'completed') return 'bg-[#46d369]/20 border-[#46d369] text-[#46d369]';
        if (status === 'cancelled') return 'bg-[#e50914]/20 border-[#e50914] text-[#e50914]';
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
    };

    const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
    const timeSlots = useMemo(() => getTimeSlots(60), []);

    return (
        <div className="bg-[#141414] border border-white/5 rounded-lg p-4 lg:p-6">
            {/* Header Controls - Netflix Style */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                    <button 
                        onClick={goToPrevious} 
                        className="p-2 rounded bg-[#222] hover:bg-[#333] text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg lg:text-xl font-bold text-white min-w-[180px] sm:min-w-[220px] text-center">{getTitle()}</h2>
                    <button 
                        onClick={goToNext} 
                        className="p-2 rounded bg-[#222] hover:bg-[#333] text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={goToToday} 
                        className="px-4 py-2 text-sm rounded bg-[#0071eb] hover:bg-[#0056b3] text-white font-semibold transition-all ml-2"
                    >
                        Hoje
                    </button>
                </div>
                <div className="flex bg-[#0f0f0f] rounded-lg p-1 border border-white/5 sm:ml-auto">
                    {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                        <button 
                            key={mode} 
                            onClick={() => setViewMode(mode)} 
                            className={`px-4 py-2 text-sm rounded transition-all font-medium ${
                                viewMode === mode 
                                    ? 'bg-[#0071eb] text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Month View */}
            {viewMode === 'month' && (
                <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNamesShort.map((day) => (
                            <div key={day} className="text-center text-xs text-gray-500 uppercase font-medium py-2">{day.slice(0, 3)}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => {
                            const dateStr = toDateString(date);
                            const dayMeetings = meetingsByDate[dateStr] || [];
                            const isCurrentMonth = date.getMonth() === currentMonth;
                            const isTodayDate = isToday(date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            return (
                                <div 
                                    key={index} 
                                    onClick={() => onDateSelect(date)} 
                                    className={`
                                        min-h-[70px] sm:min-h-[90px] lg:min-h-[100px] p-2 rounded cursor-pointer transition-all border
                                        ${isTodayDate 
                                            ? 'border-[#0071eb] bg-[#0071eb]/10' 
                                            : 'border-transparent hover:border-[#0071eb]/30'
                                        } 
                                        ${isCurrentMonth 
                                            ? isWeekend ? 'bg-[#1a1a1a]' : 'bg-[#222] hover:bg-[#333]' 
                                            : 'bg-[#0f0f0f] hover:bg-[#1a1a1a]'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all
                                            ${isTodayDate 
                                                ? 'bg-[#0071eb] text-white font-bold' 
                                                : isCurrentMonth ? 'text-white' : 'text-gray-600'
                                            }
                                        `}>
                                            {date.getDate()}
                                        </span>
                                        {dayMeetings.length > 2 && <span className="text-xs text-[#0071eb] hidden sm:inline">+{dayMeetings.length - 2}</span>}
                                    </div>
                                    <div className="hidden sm:flex flex-col gap-1">
                                        {dayMeetings.slice(0, 2).map((meeting) => (
                                            <div 
                                                key={meeting.id} 
                                                onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }} 
                                                className={`text-xs px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 transition-all ${getStatusColor(meeting.status)}`}
                                            >
                                                {formatTime(meeting.start_time)} {meeting.title}
                                            </div>
                                        ))}
                                    </div>
                                    {dayMeetings.length > 0 && (
                                        <div className="flex gap-1 sm:hidden mt-1">
                                            {dayMeetings.slice(0, 3).map((m, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        m.status === 'scheduled' ? 'bg-[#0071eb]' : 
                                                        m.status === 'completed' ? 'bg-[#46d369]' : 'bg-[#e50914]'
                                                    }`} 
                                                />
                                            ))}
                                            {dayMeetings.length > 3 && <span className="text-[8px] text-gray-500">+</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
                <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-8 gap-1 mb-2">
                            <div className="w-16" />
                            {weekDays.map((date, index) => (
                                <div 
                                    key={index} 
                                    className={`text-center py-2 rounded ${
                                        isToday(date) ? 'bg-[#0071eb]/20 border border-[#0071eb]/30' : ''
                                    }`}
                                >
                                    <div className="text-xs text-gray-500 uppercase">{dayNamesShort[date.getDay()].slice(0, 3)}</div>
                                    <div className={`text-lg font-bold ${isToday(date) ? 'text-[#0071eb]' : 'text-white'}`}>{date.getDate()}</div>
                                </div>
                            ))}
                        </div>
                        <div className="relative h-[500px] lg:h-[600px] overflow-y-auto">
                            {timeSlots.map((time) => (
                                <div key={time} className="grid grid-cols-8 gap-1" style={{ height: '50px' }}>
                                    <div className="w-16 text-xs text-gray-600 text-right pr-2 pt-1">{time}</div>
                                    {weekDays.map((date, dayIndex) => (
                                        <div 
                                            key={dayIndex} 
                                            onClick={() => onDateSelect(date, time)} 
                                            className="border-t border-white/5 hover:bg-[#0071eb]/10 cursor-pointer transition-colors" 
                                        />
                                    ))}
                                </div>
                            ))}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="grid grid-cols-8 gap-1 h-full">
                                    <div className="w-16" />
                                    {weekDays.map((date, dayIndex) => {
                                        const dateStr = toDateString(date);
                                        const dayMeetings = meetingsByDate[dateStr] || [];
                                        return (
                                            <div key={dayIndex} className="relative">
                                                {dayMeetings.map((meeting) => {
                                                    const top = getTimePosition(meeting.start_time);
                                                    const height = getMeetingHeight(meeting.start_time, meeting.end_time);
                                                    return (
                                                        <div 
                                                            key={meeting.id} 
                                                            onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }} 
                                                            className={`absolute left-0 right-1 px-1 py-1 rounded border-l-4 cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity ${getStatusColor(meeting.status)}`} 
                                                            style={{ top: `${top}%`, height: `${Math.max(height, 4)}%` }}
                                                        >
                                                            <div className="text-xs font-medium truncate">{meeting.title}</div>
                                                            <div className="text-[10px] opacity-80">{formatTime(meeting.start_time)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
                <div className="relative h-[500px] lg:h-[600px] overflow-y-auto">
                    {getTimeSlots(30).map((time) => (
                        <div key={time} className="flex" style={{ height: '40px' }}>
                            <div className="w-16 text-xs text-gray-600 text-right pr-2 pt-1 flex-shrink-0">
                                {time.endsWith(':00') ? time : ''}
                            </div>
                            <div 
                                onClick={() => onDateSelect(currentDate, time)} 
                                className="flex-1 border-t border-white/5 hover:bg-[#0071eb]/10 cursor-pointer transition-colors" 
                            />
                        </div>
                    ))}
                    <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
                        {(meetingsByDate[toDateString(currentDate)] || []).map((meeting) => {
                            const top = getTimePosition(meeting.start_time);
                            const height = getMeetingHeight(meeting.start_time, meeting.end_time);
                            return (
                                <div 
                                    key={meeting.id} 
                                    onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }} 
                                    className={`absolute left-1 right-2 px-3 py-2 rounded border-l-4 cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity ${getStatusColor(meeting.status)}`} 
                                    style={{ top: `${top}%`, height: `${Math.max(height, 6)}%` }}
                                >
                                    <div className="font-medium truncate text-sm">{meeting.title}</div>
                                    <div className="text-sm opacity-80">{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</div>
                                    {meeting.participants.length > 0 && (
                                        <div className="text-xs opacity-70 mt-1">{meeting.participants.length} participante{meeting.participants.length > 1 ? 's' : ''}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
