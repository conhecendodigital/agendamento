import React, { useState } from 'react';
import { LogOut, Plus, Calendar, Clock, Users, CalendarCheck, Loader2 } from 'lucide-react';
import { LionLogo } from './LionLogo';
import { Calendar as CalendarComponent } from './Calendar';
import { MeetingModal } from './MeetingModal';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';
import { useMeetings } from '../hooks/useMeetings';
import type { Meeting } from '../config/supabase';
import { sendWebhook } from '../utils/webhook';
import { formatDateBR, formatTime } from '../utils/dateUtils';

export const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const {
        meetings,
        loading,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        updateWebhookStatus,
        getUpcomingMeetings,
        getTodayMeetingsCount,
        getUniqueParticipantsCount,
        getNextMeeting,
    } = useMeetings();
    const { showToast } = useToast();

    // States para modais
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
    const [prefilledTime, setPrefilledTime] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            showToast('success', 'Logout realizado com sucesso!');
        } catch (error) {
            showToast('error', 'Erro ao fazer logout');
        } finally {
            setLoggingOut(false);
        }
    };

    const handleDateSelect = (date: Date, time?: string) => {
        setEditingMeeting(null);
        setPrefilledDate(date);
        setPrefilledTime(time || null);
        setShowMeetingModal(true);
    };

    const handleMeetingClick = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setShowDetailsModal(true);
    };

    const handleCreateOrUpdate = async (
        meetingData: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id'>
    ) => {
        try {
            let savedMeeting: Meeting;
            const action = editingMeeting ? 'update' : 'create';

            if (editingMeeting) {
                savedMeeting = await updateMeeting(editingMeeting.id, meetingData);
                showToast('success', 'Reunião atualizada!');
            } else {
                savedMeeting = await createMeeting(meetingData);
                showToast('success', 'Reunião agendada!');
            }

            // Enviar webhook
            if (user) {
                const webhookResult = await sendWebhook(action, savedMeeting, user);

                if (webhookResult.status === 'success') {
                    await updateWebhookStatus(savedMeeting.id, true, webhookResult.google_event_id);
                    showToast('success', 'Sincronizado com o calendário!');
                } else {
                    showToast('warning', 'Reunião salva, mas houve erro ao sincronizar.');
                }
            }
        } catch (error) {
            showToast('error', 'Erro ao salvar reunião');
            throw error;
        }
    };

    const handleEditMeeting = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setPrefilledDate(null);
        setPrefilledTime(null);
        setShowDetailsModal(false);
        setShowMeetingModal(true);
    };

    const handleCancelMeeting = async (meeting: Meeting) => {
        if (!confirm('Deseja cancelar esta reunião?')) return;

        try {
            await updateMeeting(meeting.id, { status: 'cancelled' });
            showToast('success', 'Reunião cancelada!');

            // Enviar webhook de cancelamento
            if (user) {
                const updatedMeeting = { ...meeting, status: 'cancelled' as const };
                const webhookResult = await sendWebhook('cancel', updatedMeeting, user);
                if (webhookResult.status === 'success') {
                    showToast('info', 'Google Calendar atualizado');
                }
            }

            setShowDetailsModal(false);
        } catch (error) {
            showToast('error', 'Erro ao cancelar reunião');
        }
    };

    const handleDeleteMeeting = async (meeting: Meeting) => {
        if (!confirm('Esta ação não pode ser desfeita. Deseja excluir?')) return;

        try {
            // Enviar webhook de exclusão primeiro
            if (user && meeting.google_event_id) {
                await sendWebhook('delete', meeting, user);
            }

            await deleteMeeting(meeting.id);
            showToast('success', 'Reunião excluída!');
            setShowDetailsModal(false);
        } catch (error) {
            showToast('error', 'Erro ao excluir reunião');
        }
    };

    const handleResendWebhook = async (meeting: Meeting) => {
        if (!user) return;

        try {
            const action = meeting.google_event_id ? 'update' : 'create';
            const webhookResult = await sendWebhook(action, meeting, user);

            if (webhookResult.status === 'success') {
                await updateWebhookStatus(meeting.id, true, webhookResult.google_event_id);
                showToast('success', 'Webhook reenviado com sucesso!');
                setShowDetailsModal(false);
            } else {
                showToast('error', 'Falha ao reenviar webhook');
            }
        } catch (error) {
            showToast('error', 'Erro ao reenviar webhook');
        }
    };

    const upcomingMeetings = getUpcomingMeetings(5);
    const todayCount = getTodayMeetingsCount();
    const uniqueParticipants = getUniqueParticipantsCount();
    const nextMeeting = getNextMeeting();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-dark border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <LionLogo size={32} className="text-amber-500" />
                            <span className="text-lg font-semibold text-amber-500 hidden sm:inline">
                                Valento Academy
                            </span>
                        </div>

                        {/* User info e logout */}
                        <div className="flex items-center gap-4">
                            <span className="text-slate-300 text-sm hidden sm:inline">
                                {user?.user_metadata.full_name || user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                {loggingOut ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <LogOut className="w-5 h-5" />
                                )}
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Cards de resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total de reuniões */}
                    <div className="glass rounded-xl p-4 sm:p-6 card-hover">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <span className="text-slate-400 text-sm">Total</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 skeleton rounded" />
                        ) : (
                            <p className="text-2xl sm:text-3xl font-bold text-white">{meetings.length}</p>
                        )}
                    </div>

                    {/* Reuniões hoje */}
                    <div className="glass rounded-xl p-4 sm:p-6 card-hover">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <span className="text-slate-400 text-sm">Hoje</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 skeleton rounded" />
                        ) : (
                            <p className="text-2xl sm:text-3xl font-bold text-white">{todayCount}</p>
                        )}
                    </div>

                    {/* Próxima reunião */}
                    <div className="glass rounded-xl p-4 sm:p-6 card-hover">
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarCheck className="w-5 h-5 text-amber-500" />
                            <span className="text-slate-400 text-sm">Próxima</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-24 skeleton rounded" />
                        ) : nextMeeting ? (
                            <div>
                                <p className="text-sm font-semibold text-white truncate">{nextMeeting.title}</p>
                                <p className="text-xs text-slate-400">
                                    {formatDateBR(new Date(nextMeeting.date + 'T12:00:00'))} às {formatTime(nextMeeting.start_time)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Nenhuma</p>
                        )}
                    </div>

                    {/* Participantes únicos */}
                    <div className="glass rounded-xl p-4 sm:p-6 card-hover">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            <span className="text-slate-400 text-sm">Participantes</span>
                        </div>
                        {loading ? (
                            <div className="h-8 w-16 skeleton rounded" />
                        ) : (
                            <p className="text-2xl sm:text-3xl font-bold text-white">{uniqueParticipants}</p>
                        )}
                    </div>
                </div>

                {/* Layout principal: calendário + sidebar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Calendário */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="glass rounded-2xl p-6">
                                <div className="h-8 w-48 skeleton rounded mb-6" />
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: 35 }).map((_, i) => (
                                        <div key={i} className="h-20 skeleton rounded" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <CalendarComponent
                                meetings={meetings}
                                onDateSelect={handleDateSelect}
                                onMeetingClick={handleMeetingClick}
                            />
                        )}
                    </div>

                    {/* Sidebar - Próximas reuniões */}
                    <div className="w-full lg:w-80">
                        <div className="glass rounded-2xl p-4 sm:p-6">
                            <h3 className="font-semibold text-white mb-4">Próximos Agendamentos</h3>

                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-20 skeleton rounded-lg" />
                                    ))}
                                </div>
                            ) : upcomingMeetings.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-8">
                                    Nenhum agendamento próximo
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingMeetings.map((meeting) => (
                                        <div
                                            key={meeting.id}
                                            onClick={() => handleMeetingClick(meeting)}
                                            className="bg-slate-800/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                                        >
                                            <p className="font-medium text-white text-sm truncate">{meeting.title}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatDateBR(new Date(meeting.date + 'T12:00:00'))} às {formatTime(meeting.start_time)}
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <Users className="w-3 h-3 text-slate-500" />
                                                <span className="text-xs text-slate-500">{meeting.participants.length}</span>
                                                <span
                                                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${meeting.status === 'scheduled'
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : meeting.status === 'completed'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                        }`}
                                                >
                                                    {meeting.status === 'scheduled'
                                                        ? 'Agendada'
                                                        : meeting.status === 'completed'
                                                            ? 'Concluída'
                                                            : 'Cancelada'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* FAB - Botão de criar reunião */}
            <button
                onClick={() => {
                    setEditingMeeting(null);
                    setPrefilledDate(null);
                    setPrefilledTime(null);
                    setShowMeetingModal(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center hover:bg-amber-400 hover:scale-110 transition-all z-30"
            >
                <Plus className="w-6 h-6 text-slate-900" />
            </button>

            {/* Modais */}
            <MeetingModal
                isOpen={showMeetingModal}
                onClose={() => {
                    setShowMeetingModal(false);
                    setEditingMeeting(null);
                }}
                onSave={handleCreateOrUpdate}
                editMeeting={editingMeeting}
                prefilledDate={prefilledDate}
                prefilledTime={prefilledTime}
            />

            <MeetingDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                meeting={selectedMeeting}
                onEdit={handleEditMeeting}
                onCancel={handleCancelMeeting}
                onDelete={handleDeleteMeeting}
                onResendWebhook={handleResendWebhook}
            />
        </div>
    );
};

export default Dashboard;
