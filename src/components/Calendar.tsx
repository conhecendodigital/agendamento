import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Meeting } from '../config/supabase';
import {
    monthNames,
    dayNamesShort,
    getCalendarDays,
    getWeekDays,
    getTimeSlots,
    toDateString,
    isToday,
    isSameDay,
    formatTime,
    formatDateFull,
    getTimePosition,
    getMeetingHeight,
} from '../utils/dateUtils';

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

    // Navegação
    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Função para obter o título do período atual
    const getTitle = (): string => {
        if (viewMode === 'month') {
            return `${monthNames[currentMonth]} ${currentYear}`;
        } else if (viewMode === 'week') {
            const weekDays = getWeekDays(currentDate);
            const start = weekDays[0];
            const end = weekDays[6];
            if (start.getMonth() === end.getMonth()) {
                return `${start.getDate()} - ${end.getDate()} de ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
            }
            return `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
        } else {
            return formatDateFull(currentDate);
        }
    };

    // Mapear reuniões por data
    const meetingsByDate = useMemo(() => {
        const map: Record<string, Meeting[]> = {};
        meetings.forEach((meeting) => {
            if (!map[meeting.date]) {
                map[meeting.date] = [];
            }
            map[meeting.date].push(meeting);
        });
        // Ordenar reuniões por horário
        Object.keys(map).forEach((date) => {
            map[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });
        return map;
    }, [meetings]);

    // Obter cor baseada no status
    const getStatusColor = (status: Meeting['status']) => {
        switch (status) {
            case 'scheduled':
                return 'bg-amber-500/20 border-amber-500 text-amber-400';
            case 'completed':
                return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
            case 'cancelled':
                return 'bg-red-500/20 border-red-500 text-red-400';
            default:
                return 'bg-slate-500/20 border-slate-500 text-slate-400';
        }
    };

    // Dias do calendário para visualização de mês
    const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

    // Dias da semana para visualização de semana
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Slots de tempo para visualização de semana/dia
    const timeSlots = useMemo(() => getTimeSlots(60), []);

    return (
        <div className="glass rounded-2xl p-4 sm:p-6 animate-fadeIn">
            {/* Header do calendário */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={goToPrevious}
                        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-white min-w-[200px] text-center">
                        {getTitle()}
                    </h2>
                    <button
                        onClick={goToNext}
                        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                    >
                        Hoje
                    </button>
                </div>

                {/* Tabs de visualização */}
                <div className="flex bg-slate-800/50 rounded-lg p-1">
                    {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === mode
                                ? 'bg-amber-500 text-slate-900 font-medium'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visualização de Mês */}
            {viewMode === 'month' && (
                <div className="animate-fadeIn">
                    {/* Headers dos dias */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNamesShort.map((day) => (
                            <div key={day} className="text-center text-xs text-slate-400 uppercase font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Células dos dias */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => {
                            const dateStr = toDateString(date);
                            const dayMeetings = meetingsByDate[dateStr] || [];
                            const isCurrentMonth = date.getMonth() === currentMonth;
                            const isTodayDate = isToday(date);

                            return (
                                <div
                                    key={index}
                                    onClick={() => onDateSelect(date)}
                                    className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg cursor-pointer transition-all ${isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-900/30'
                                        } hover:bg-slate-700/40 border border-transparent hover:border-slate-600/50`}
                                >
                                    {/* Número do dia */}
                                    <div className="flex justify-between items-start mb-1">
                                        <span
                                            className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm ${isTodayDate
                                                ? 'bg-amber-500 text-slate-900 font-bold'
                                                : isCurrentMonth
                                                    ? 'text-white'
                                                    : 'text-slate-600'
                                                }`}
                                        >
                                            {date.getDate()}
                                        </span>
                                        {dayMeetings.length > 2 && (
                                            <span className="text-xs text-amber-400 hidden sm:inline">
                                                +{dayMeetings.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    {/* Mini cards de reuniões (apenas em desktop) */}
                                    <div className="hidden sm:flex flex-col gap-1">
                                        {dayMeetings.slice(0, 2).map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMeetingClick(meeting);
                                                }}
                                                className={`text-xs px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 ${getStatusColor(meeting.status)}`}
                                            >
                                                {formatTime(meeting.start_time)} {meeting.title}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Indicadores de reunião em mobile */}
                                    {dayMeetings.length > 0 && (
                                        <div className="flex gap-0.5 sm:hidden mt-1">
                                            {dayMeetings.slice(0, 3).map((meeting, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full ${meeting.status === 'scheduled'
                                                        ? 'bg-amber-500'
                                                        : meeting.status === 'completed'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-red-500'
                                                        }`}
                                                />
                                            ))}
                                            {dayMeetings.length > 3 && (
                                                <span className="text-[10px] text-slate-400">+</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Visualização de Semana */}
            {viewMode === 'week' && (
                <div className="animate-fadeIn overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Headers dos dias */}
                        <div className="grid grid-cols-8 gap-1 mb-2">
                            <div className="w-16" /> {/* Espaço para horários */}
                            {weekDays.map((date, index) => (
                                <div
                                    key={index}
                                    className={`text-center py-2 rounded-lg ${isToday(date) ? 'bg-amber-500/20' : ''
                                        }`}
                                >
                                    <div className="text-xs text-slate-400 uppercase">{dayNamesShort[date.getDay()]}</div>
                                    <div
                                        className={`text-lg font-bold ${isToday(date) ? 'text-amber-500' : 'text-white'
                                            }`}
                                    >
                                        {date.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid de horários */}
                        <div className="relative h-[600px] overflow-y-auto">
                            {/* Linhas de horário */}
                            {timeSlots.map((time) => (
                                <div key={time} className="grid grid-cols-8 gap-1" style={{ height: '50px' }}>
                                    <div className="w-16 text-xs text-slate-500 text-right pr-2 pt-0.5">
                                        {time}
                                    </div>
                                    {weekDays.map((date, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            onClick={() => onDateSelect(date, time)}
                                            className="border-t border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors relative"
                                        />
                                    ))}
                                </div>
                            ))}

                            {/* Overlay de reuniões */}
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMeetingClick(meeting);
                                                            }}
                                                            className={`absolute left-0 right-1 px-1 py-0.5 rounded-r border-l-4 cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity overflow-hidden ${getStatusColor(meeting.status)}`}
                                                            style={{
                                                                top: `${top}%`,
                                                                height: `${Math.max(height, 3)}%`,
                                                            }}
                                                        >
                                                            <div className="text-xs font-medium truncate">
                                                                {meeting.title}
                                                            </div>
                                                            <div className="text-[10px] opacity-80">
                                                                {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Indicador de hora atual */}
                            {weekDays.some((d) => isToday(d)) && (() => {
                                const now = new Date();
                                const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                const top = getTimePosition(nowTime);
                                if (top >= 0 && top <= 100) {
                                    return (
                                        <div
                                            className="absolute left-16 right-0 h-0.5 bg-red-500 z-10"
                                            style={{ top: `${top}%` }}
                                        >
                                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Visualização de Dia */}
            {viewMode === 'day' && (
                <div className="animate-fadeIn">
                    {/* Grid de horários */}
                    <div className="relative h-[600px] overflow-y-auto">
                        {/* Linhas de horário */}
                        {getTimeSlots(30).map((time) => (
                            <div key={time} className="flex" style={{ height: '40px' }}>
                                <div className="w-16 text-xs text-slate-500 text-right pr-2 pt-0.5 flex-shrink-0">
                                    {time.endsWith(':00') ? time : ''}
                                </div>
                                <div
                                    onClick={() => onDateSelect(currentDate, time)}
                                    className="flex-1 border-t border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
                                />
                            </div>
                        ))}

                        {/* Reuniões do dia */}
                        <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
                            {(meetingsByDate[toDateString(currentDate)] || []).map((meeting) => {
                                const top = getTimePosition(meeting.start_time);
                                const height = getMeetingHeight(meeting.start_time, meeting.end_time);
                                return (
                                    <div
                                        key={meeting.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMeetingClick(meeting);
                                        }}
                                        className={`absolute left-1 right-2 px-3 py-2 rounded-lg border-l-4 cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity ${getStatusColor(meeting.status)}`}
                                        style={{
                                            top: `${top}%`,
                                            height: `${Math.max(height, 5)}%`,
                                        }}
                                    >
                                        <div className="font-medium truncate">{meeting.title}</div>
                                        <div className="text-sm opacity-80">
                                            {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                                        </div>
                                        {meeting.participants.length > 0 && (
                                            <div className="text-xs opacity-70 mt-1">
                                                {meeting.participants.length} participante{meeting.participants.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Indicador de hora atual */}
                        {isToday(currentDate) && (() => {
                            const now = new Date();
                            const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            const top = getTimePosition(nowTime);
                            if (top >= 0 && top <= 100) {
                                return (
                                    <div
                                        className="absolute left-16 right-0 h-0.5 bg-red-500 z-10"
                                        style={{ top: `${top}%` }}
                                    >
                                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                                        <span className="absolute left-4 -top-2.5 text-xs text-red-500 font-medium">Agora</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
