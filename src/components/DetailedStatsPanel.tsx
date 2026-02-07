import React from 'react';
import { BarChart3, TrendingUp, Activity, Users, Clock, Calendar } from 'lucide-react';
import type { DetailedStats } from '../utils/statsCalculator';
import type { Meeting } from '../hooks/useMeetings';
import { formatDateBR, formatTime } from '../utils/dateUtils';

interface DetailedStatsPanelProps {
    stats: DetailedStats;
    meetings: Meeting[];
    upcomingMeetings: Meeting[];
    onMeetingClick?: (meeting: Meeting) => void;
}

// ===== Sub-components =====

const StatBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
            </div>
            <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                />
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
    </div>
);

const CardHeader: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string }> = ({ icon: Icon, title }) => (
    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-[#0071eb]" />
        {title}
    </h3>
);

// ===== Main Component =====

export const DetailedStatsPanel: React.FC<DetailedStatsPanelProps> = ({ stats, meetings, upcomingMeetings, onMeetingClick }) => {
    const total = meetings.length;

    return (
        <div className="space-y-4">
            {/* Por Status */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <CardHeader icon={BarChart3} title="Por Status" />
                <div className="space-y-3">
                    <StatBar label="Agendadas" value={stats.byStatus.scheduled} total={total} color="bg-[#0071eb]" />
                    <StatBar label="Finalizadas" value={stats.byStatus.completed} total={total} color="bg-[#46d369]" />
                    <StatBar label="Canceladas" value={stats.byStatus.cancelled} total={total} color="bg-[#e50914]" />
                </div>
            </div>

            {/* Por Período */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <CardHeader icon={TrendingUp} title="Por Período" />
                <div className="space-y-1">
                    <InfoRow label="Esta Semana" value={stats.byPeriod.thisWeek} />
                    <InfoRow label="Este Mês" value={stats.byPeriod.thisMonth} />
                    <InfoRow label="Próximos 7 Dias" value={stats.byPeriod.nextWeek} />
                </div>
            </div>

            {/* Produtividade */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <CardHeader icon={Activity} title="Produtividade" />
                <div className="space-y-1">
                    <InfoRow label="Total de Horas" value={`${stats.productivity.totalHours}h`} />
                    <InfoRow label="Duração Média" value={`${stats.productivity.avgDuration}min`} />
                    <InfoRow label="Dia Mais Ativo" value={stats.productivity.mostActiveDay} />
                </div>
            </div>

            {/* Top Participantes */}
            {stats.topParticipants.length > 0 && (
                <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
                    <CardHeader icon={Users} title="Participantes Frequentes" />
                    <div className="space-y-2.5">
                        {stats.topParticipants.map((p, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-[#0071eb] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                        {p.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-200 truncate">{p.name}</p>
                                        <p className="text-[11px] text-gray-600 truncate">{p.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-full">{p.count}x</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Próximas Reuniões */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <CardHeader icon={Clock} title="Próximos" />
                {upcomingMeetings.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">Nenhum agendamento</p>
                ) : (
                    <div className="space-y-2">
                        {upcomingMeetings.map(m => (
                            <button
                                key={m.id}
                                onClick={() => onMeetingClick?.(m)}
                                className="w-full text-left p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] active:bg-[#2a2a2a] transition-all border border-transparent hover:border-[#0071eb]/20"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium text-white truncate mr-2">{m.title}</span>
                                    <span className="text-[10px] bg-[#0071eb]/15 text-[#0071eb] px-1.5 py-0.5 rounded flex-shrink-0 font-medium">
                                        {formatTime(m.start_time)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateBR(new Date(m.date + 'T12:00:00'))}
                                    {m.participants.length > 0 && (
                                        <>
                                            <span className="text-gray-700">·</span>
                                            <Users className="w-3 h-3" />
                                            {m.participants.length}
                                        </>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailedStatsPanel;
