import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meeting } from '../hooks/useMeetings';
import { monthNames, dayNamesShort, getCalendarDays, getWeekDays, toDateString, isToday, formatTime, formatDateFull } from '../utils/dateUtils';

type ViewMode = 'month' | 'week' | 'day';

// Constantes de layout - estilo Google Calendar
const HOUR_HEIGHT = 60; // pixels por hora
const START_HOUR = 6;   // começa às 6h
const END_HOUR = 23;    // termina às 23h
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

interface CalendarProps {
    meetings: Meeting[];
    onDateSelect: (date: Date, time?: string) => void;
    onMeetingClick: (meeting: Meeting) => void;
}

// Converte horário (HH:MM:SS) para posição em pixels
const timeToPixels = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
};

// Altura do evento em pixels baseado na duração
const eventHeight = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max((minutes / 60) * HOUR_HEIGHT, 24); // mínimo 24px
};

// Gera as horas para exibir na coluna da esquerda
const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

export const Calendar: React.FC<CalendarProps> = ({ meetings, onDateSelect, onMeetingClick }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Auto-scroll para hora atual na primeira renderização
    useEffect(() => {
        if (scrollRef.current && (viewMode === 'week' || viewMode === 'day')) {
            const now = new Date();
            const scrollTo = (now.getHours() - START_HOUR - 1) * HOUR_HEIGHT;
            scrollRef.current.scrollTop = Math.max(0, scrollTo);
        }
    }, [viewMode]);

    const goToPrevious = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
        else if (viewMode === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };

    const goToNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
        else if (viewMode === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };

    const goToToday = () => setCurrentDate(new Date());

    const getTitle = (): string => {
        if (viewMode === 'month') return `${monthNames[currentMonth]} ${currentYear}`;
        if (viewMode === 'week') {
            const wd = getWeekDays(currentDate);
            const s = wd[0], e = wd[6];
            if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.getDate()} de ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
            return `${s.getDate()} ${monthNames[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${monthNames[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
        }
        return formatDateFull(currentDate);
    };

    const meetingsByDate = useMemo(() => {
        const map: Record<string, Meeting[]> = {};
        meetings.forEach((m) => { if (!map[m.date]) map[m.date] = []; map[m.date].push(m); });
        Object.keys(map).forEach((date) => { map[date].sort((a, b) => a.start_time.localeCompare(b.start_time)); });
        return map;
    }, [meetings]);

    const getStatusColor = (status: Meeting['status']) => {
        if (status === 'scheduled') return 'bg-[#1a73e8] border-[#1a73e8] text-white';
        if (status === 'completed') return 'bg-[#0d652d] border-[#0d652d] text-white';
        if (status === 'cancelled') return 'bg-[#c5221f] border-[#c5221f] text-white/80';
        return 'bg-gray-600 border-gray-600 text-white';
    };

    const getStatusDot = (status: Meeting['status']) => {
        if (status === 'scheduled') return 'bg-[#1a73e8]';
        if (status === 'completed') return 'bg-[#0d652d]';
        if (status === 'cancelled') return 'bg-[#c5221f]';
        return 'bg-gray-500';
    };

    const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    // Indica hora atual com linha vermelha
    const CurrentTimeLine = () => {
        const now = new Date();
        const top = (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
        if (top < 0 || top > TOTAL_HEIGHT) return null;
        return (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg shadow-red-500/30" />
                    <div className="flex-1 h-[2px] bg-red-500 shadow-lg shadow-red-500/20" />
                </div>
            </div>
        );
    };

    // Renderiza os eventos de um dia na view de semana/dia
    const renderDayEvents = (dateStr: string, isDayView: boolean = false) => {
        const dayMeetings = meetingsByDate[dateStr] || [];
        return dayMeetings.map((meeting) => {
            const top = timeToPixels(meeting.start_time);
            const height = eventHeight(meeting.start_time, meeting.end_time);
            return (
                <div
                    key={meeting.id}
                    onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }}
                    className={`absolute left-1 right-1 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:shadow-black/30 hover:brightness-110 overflow-hidden ${getStatusColor(meeting.status)}`}
                    style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
                >
                    <div className={`h-full px-2 ${height > 40 ? 'py-1.5' : 'py-0.5'} flex flex-col`}>
                        <div className={`font-semibold truncate ${height > 30 ? 'text-xs' : 'text-[10px]'}`}>
                            {meeting.title}
                        </div>
                        {height > 35 && (
                            <div className="text-[10px] opacity-80">
                                {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
                            </div>
                        )}
                        {height > 55 && isDayView && meeting.participants.length > 0 && (
                            <div className="text-[10px] opacity-70 mt-auto">
                                {meeting.participants.length} participante{meeting.participants.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    // Grelha de horas (background grid)
    const TimeGrid = ({ onCellClick, colCount = 1, dates }: {
        onCellClick: (date: Date, time: string) => void;
        colCount?: number;
        dates: Date[];
    }) => (
        <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
            {/* Linhas horizontais das horas */}
            {hours.map((hour) => (
                <div key={hour} className="absolute left-0 right-0" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}>
                    <div className="border-t border-white/[0.06]" />
                    {/* Linha de meia hora */}
                    <div className="absolute left-0 right-0" style={{ top: `${HOUR_HEIGHT / 2}px` }}>
                        <div className="border-t border-white/[0.03] border-dashed" />
                    </div>
                </div>
            ))}
            {/* Colunas clicáveis */}
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                {dates.map((date, i) => (
                    <div key={i} className="relative border-l border-white/[0.06] first:border-l-0">
                        {hours.map((hour) => (
                            <div key={hour}>
                                <div
                                    className="absolute left-0 right-0 hover:bg-[#1a73e8]/10 cursor-pointer transition-colors"
                                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT / 2}px` }}
                                    onClick={() => onCellClick(date, `${hour.toString().padStart(2, '0')}:00`)}
                                />
                                <div
                                    className="absolute left-0 right-0 hover:bg-[#1a73e8]/10 cursor-pointer transition-colors"
                                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`, height: `${HOUR_HEIGHT / 2}px` }}
                                    onClick={() => onCellClick(date, `${hour.toString().padStart(2, '0')}:30`)}
                                />
                            </div>
                        ))}
                        {/* Eventos */}
                        {renderDayEvents(toDateString(date), colCount === 1)}
                    </div>
                ))}
            </div>
            {/* Linha da hora atual */}
            <CurrentTimeLine />
        </div>
    );

    return (
        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 lg:px-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <button onClick={goToPrevious} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg lg:text-xl font-semibold text-white ml-2">{getTitle()}</h2>
                    <button onClick={goToToday} className="ml-3 px-3 py-1.5 text-sm rounded-full border border-white/20 hover:bg-white/10 text-white font-medium transition-all">
                        Hoje
                    </button>
                </div>
                <div className="flex bg-[#0f0f0f] rounded-full p-1 border border-white/5 sm:ml-auto">
                    {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-1.5 text-sm rounded-full transition-all font-medium ${viewMode === mode
                                    ? 'bg-[#1a73e8] text-white shadow-lg shadow-[#1a73e8]/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                        </button>
                    ))}
                </div>
            </div>

            {/* =================== MONTH VIEW =================== */}
            {viewMode === 'month' && (
                <div className="p-4 lg:px-6">
                    <div className="grid grid-cols-7 gap-px mb-px">
                        {dayNamesShort.map((day) => (
                            <div key={day} className="text-center text-xs text-gray-500 uppercase font-medium py-2">{day.slice(0, 3)}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-white/[0.03] rounded-lg overflow-hidden">
                        {calendarDays.map((date, index) => {
                            const dateStr = toDateString(date);
                            const dayMeetings = meetingsByDate[dateStr] || [];
                            const isCurrentMonth = date.getMonth() === currentMonth;
                            const isTodayDate = isToday(date);

                            return (
                                <div
                                    key={index}
                                    onClick={() => onDateSelect(date)}
                                    className={`
                                        min-h-[80px] sm:min-h-[100px] lg:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition-all
                                        ${isCurrentMonth ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-[#111] hover:bg-[#1a1a1a]'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all
                                            ${isTodayDate
                                                ? 'bg-[#1a73e8] text-white font-bold'
                                                : isCurrentMonth ? 'text-gray-200' : 'text-gray-600'
                                            }
                                        `}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                    <div className="hidden sm:flex flex-col gap-0.5">
                                        {dayMeetings.slice(0, 3).map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }}
                                                className={`text-[11px] px-1.5 py-[2px] rounded truncate cursor-pointer hover:brightness-110 transition-all ${getStatusColor(meeting.status)}`}
                                            >
                                                <span className="font-medium">{formatTime(meeting.start_time)}</span> {meeting.title}
                                            </div>
                                        ))}
                                        {dayMeetings.length > 3 && (
                                            <div className="text-[10px] text-[#1a73e8] font-medium pl-1 hover:underline cursor-pointer">
                                                +{dayMeetings.length - 3} mais
                                            </div>
                                        )}
                                    </div>
                                    {dayMeetings.length > 0 && (
                                        <div className="flex gap-1 sm:hidden mt-1">
                                            {dayMeetings.slice(0, 4).map((m, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${getStatusDot(m.status)}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* =================== WEEK VIEW =================== */}
            {viewMode === 'week' && (
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Header com dias da semana */}
                        <div className="grid border-b border-white/[0.06] sticky top-0 z-30 bg-[#141414]" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                            <div className="py-3" /> {/* Espaço da coluna de horas */}
                            {weekDays.map((date, i) => {
                                const isTodayDate = isToday(date);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => { setCurrentDate(date); setViewMode('day'); }}
                                        className={`text-center py-3 cursor-pointer transition-colors hover:bg-white/5 border-l border-white/[0.06] first:border-l-0`}
                                    >
                                        <div className="text-[11px] text-gray-500 uppercase tracking-wider">
                                            {dayNamesShort[date.getDay()].slice(0, 3)}
                                        </div>
                                        <div className={`
                                            w-10 h-10 mx-auto flex items-center justify-center rounded-full text-xl font-medium mt-1
                                            ${isTodayDate ? 'bg-[#1a73e8] text-white' : 'text-gray-200 hover:bg-white/10'}
                                        `}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Corpo com time grid */}
                        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)', minHeight: '500px' }}>
                            <div className="grid" style={{ gridTemplateColumns: '56px 1fr' }}>
                                {/* Coluna de horas */}
                                <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="absolute right-2 text-[11px] text-gray-500 leading-none"
                                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 6}px` }}
                                        >
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>
                                {/* Grid de eventos */}
                                <TimeGrid
                                    colCount={7}
                                    dates={weekDays}
                                    onCellClick={(date, time) => onDateSelect(date, time)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================== DAY VIEW =================== */}
            {viewMode === 'day' && (
                <div>
                    {/* Header do dia */}
                    <div className="border-b border-white/[0.06] px-4 py-3">
                        <div className="flex items-center gap-3 ml-14">
                            <div className={`
                                w-12 h-12 flex items-center justify-center rounded-full text-2xl font-medium
                                ${isToday(currentDate) ? 'bg-[#1a73e8] text-white' : 'text-gray-200'}
                            `}>
                                {currentDate.getDate()}
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">{dayNamesShort[currentDate.getDay()]}</div>
                                <div className="text-xs text-gray-500">
                                    {(meetingsByDate[toDateString(currentDate)] || []).length} evento(s)
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Corpo */}
                    <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '500px' }}>
                        <div className="grid" style={{ gridTemplateColumns: '56px 1fr' }}>
                            {/* Coluna de horas */}
                            <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        className="absolute right-2 text-[11px] text-gray-500 leading-none"
                                        style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT - 6}px` }}
                                    >
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>
                            {/* Grid de eventos */}
                            <TimeGrid
                                colCount={1}
                                dates={[currentDate]}
                                onCellClick={(date, time) => onDateSelect(date, time)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
