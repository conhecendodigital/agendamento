import React, { useState, useMemo } from 'react';
import { LogOut, Plus, Calendar, Clock, Users, CalendarCheck, Loader2, MessageSquare, ChevronLeft, ChevronRight, Menu, X as XIcon, BarChart3 } from 'lucide-react';
import { LionLogo } from './LionLogo';
import { Calendar as CalendarComponent } from './Calendar';
import { ChatPanel } from './ChatPanel';
import { DetailedStatsPanel } from './DetailedStatsPanel';
import { MeetingModal } from './MeetingModal';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';
import { useMeetings } from '../hooks/useMeetings';
import type { Meeting } from '../hooks/useMeetings';
import { sendWebhook } from '../utils/webhook';
import { formatTime } from '../utils/dateUtils';
import { getRandomPhrase } from '../utils/motivationalPhrases';
import { calculateDetailedStats } from '../utils/statsCalculator';

export const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const { meetings, createMeeting, updateMeeting, deleteMeeting, updateWebhookStatus, getUpcomingMeetings, getTodayMeetingsCount, getUniqueParticipantsCount, getNextMeeting } = useMeetings();
    const { showToast } = useToast();

    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
    const [prefilledTime, setPrefilledTime] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'calendar'>('chat'); // Chat as default
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);

    // Detailed stats
    const detailedStats = useMemo(() => calculateDetailedStats(meetings), [meetings]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            showToast('success', 'Logout realizado!');
        }
        catch {
            showToast('error', 'Erro ao sair');
        }
        finally { setLoggingOut(false); }
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

    const handleCreateOrUpdate = async (meetingData: any) => {
        try {
            let savedMeeting: Meeting;
            const action = editingMeeting ? 'update' : 'create';
            if (editingMeeting) {
                savedMeeting = await updateMeeting(editingMeeting.id, meetingData);
                showToast('success', 'Atualizado!');
            } else {
                savedMeeting = await createMeeting(meetingData);
                showToast('success', 'Agendado!');
            }
            if (user) {
                const webhookResult = await sendWebhook(action, savedMeeting, user);
                if (webhookResult.status === 'success') {
                    await updateWebhookStatus(savedMeeting.id, true, webhookResult.google_event_id, webhookResult.meet_link);
                    const phrase = getRandomPhrase();
                    const actionLabel = action === 'create' ? '✅ Evento criado com sucesso!' : '✅ Evento atualizado!';
                    showToast('success', actionLabel, {
                        meetLink: webhookResult.meet_link,
                        subtitle: phrase,
                    });
                }
            }
        } catch {
            showToast('error', 'Erro ao salvar');
        }
    };

    const handleConfirmSchedule = async (parsed: any) => {
        if (!user) return { status: 'error', message: 'Não autenticado' };

        const meetingData = {
            title: parsed.title,
            description: parsed.description,
            date: parsed.date,
            start_time: parsed.start_time,
            end_time: parsed.end_time,
            participants: parsed.participants,
            participant_names: parsed.participant_names,
            status: 'scheduled' as const,
        };

        const savedMeeting = await createMeeting(meetingData);
        const result = await sendWebhook('create', savedMeeting, user);

        if (result.status === 'success') {
            await updateWebhookStatus(savedMeeting.id, true, result.google_event_id, result.meet_link);
            const phrase = getRandomPhrase();
            showToast('success', '✅ Agendado pelo Chat!', { meetLink: result.meet_link, subtitle: phrase });
        }

        return result;
    };

    const openNewMeeting = () => {
        setEditingMeeting(null);
        setPrefilledDate(null);
        setPrefilledTime(null);
        setShowMeetingModal(true);
    };

    const upcomingMeetings = getUpcomingMeetings(5);
    const todayCount = getTodayMeetingsCount();
    const uniqueParticipants = getUniqueParticipantsCount();
    const nextMeeting = getNextMeeting();

    const sidebarWidth = sidebarCollapsed ? 'w-[68px]' : 'w-[260px]';

    return (
        <div className="flex h-[100dvh] bg-[#0a0a0a] text-gray-200 overflow-hidden">

            {/* ===== MOBILE: Top Header ===== */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#111111]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <LionLogo size={28} className="text-[#0071eb]" />
                    <span className="text-base font-bold text-white">
                        Valento <span className="text-[#0071eb]">Academy</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg active:bg-white/10"
                    >
                        {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* ===== MOBILE: Menu Dropdown ===== */}
            {mobileMenuOpen && (
                <>
                    <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="md:hidden fixed top-14 right-0 z-50 w-64 bg-[#141414] border-l border-b border-white/5 rounded-bl-2xl shadow-2xl animate-fadeIn">
                        {/* User Info */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0071eb] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                    {(user?.user_metadata.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{user?.user_metadata.full_name}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                        {/* Stats */}
                        <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/5">
                            {[
                                { label: 'Total', value: meetings.length, icon: Calendar },
                                { label: 'Hoje', value: todayCount, icon: Clock },
                                { label: 'Participantes', value: uniqueParticipants, icon: Users },
                                { label: 'Próxima', value: nextMeeting ? formatTime(nextMeeting.start_time) : '-', icon: CalendarCheck },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                    <s.icon className="w-3.5 h-3.5 text-[#0071eb] flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                                        <p className="text-sm font-semibold text-white">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Logout */}
                        <div className="p-3">
                            <button
                                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                disabled={loggingOut}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 active:bg-red-400/10 transition-all"
                            >
                                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                <span className="text-sm">Sair</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ===== DESKTOP: Left Sidebar ===== */}
            <aside className={`hidden md:flex ${sidebarWidth} flex-shrink-0 bg-[#111111] border-r border-white/5 flex-col transition-all duration-300 ease-in-out`}>
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5 flex-shrink-0">
                    <LionLogo size={32} className="text-[#0071eb] flex-shrink-0" />
                    {!sidebarCollapsed && (
                        <span className="text-lg font-bold text-white truncate">
                            Valento <span className="text-[#0071eb]">Academy</span>
                        </span>
                    )}
                </div>

                {/* New Meeting Button */}
                <div className="px-3 py-4 flex-shrink-0">
                    <button
                        onClick={openNewMeeting}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0071eb] hover:bg-[#0056b3] text-white font-medium transition-all hover:shadow-lg hover:shadow-[#0071eb]/20 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">Novo Agendamento</span>}
                    </button>
                </div>

                {/* Navigation — Chat first */}
                <nav className="px-3 space-y-1 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat'
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <MessageSquare className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span>Agenda Chat</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'calendar'
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span>Calendário</span>}
                    </button>
                </nav>

                {/* Quick Stats (sidebar) */}
                {!sidebarCollapsed && (
                    <div className="px-3 mt-6 flex-shrink-0">
                        <p className="px-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-2">Resumo</p>
                        <div className="space-y-1">
                            {[
                                { label: 'Total', value: meetings.length, icon: Calendar },
                                { label: 'Hoje', value: todayCount, icon: Clock },
                                { label: 'Participantes', value: uniqueParticipants, icon: Users },
                                { label: 'Próxima', value: nextMeeting ? formatTime(nextMeeting.start_time) : '-', icon: CalendarCheck },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                                    <s.icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                    <span className="text-gray-500 truncate">{s.label}</span>
                                    <span className="ml-auto text-white font-semibold text-xs">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* User + Collapse */}
                <div className="mt-auto border-t border-white/5 p-3 flex-shrink-0">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg hover:bg-white/5 transition-all">
                            <div className="w-8 h-8 rounded-full bg-[#0071eb] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {(user?.user_metadata.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-white truncate">{user?.user_metadata.full_name?.split(' ')[0]}</p>
                                <p className="text-[11px] text-gray-600 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                title="Sair"
                            >
                                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        {!sidebarCollapsed && <span className="text-xs">Recolher</span>}
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-0 pb-16 md:pb-0">
                {/* Desktop Top Bar */}
                <header className="hidden md:flex h-16 items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0a] flex-shrink-0">
                    <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                        {activeTab === 'chat' ? (
                            <><MessageSquare className="w-5 h-5 text-[#0071eb]" /> Agenda Chat</>
                        ) : (
                            <><Calendar className="w-5 h-5 text-[#0071eb]" /> Calendário</>
                        )}
                    </h1>
                    <div className="flex items-center gap-4">
                        {nextMeeting && (
                            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
                                <CalendarCheck className="w-4 h-4 text-[#0071eb]" />
                                <span>Próxima: <span className="text-gray-300">{nextMeeting.title}</span> às {formatTime(nextMeeting.start_time)}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Area — Two columns on desktop */}
                <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                    {/* Mobile: Stats toggle button */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setShowMobileStats(!showMobileStats)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#141414] border border-white/5 rounded-xl text-gray-300 text-sm font-medium active:bg-[#222] transition-all"
                        >
                            <BarChart3 className="w-4 h-4 text-[#0071eb]" />
                            {showMobileStats ? 'Ocultar Estatísticas' : 'Ver Estatísticas Detalhadas'}
                        </button>
                        {showMobileStats && (
                            <div className="mt-4 animate-fadeIn">
                                <DetailedStatsPanel
                                    stats={detailedStats}
                                    meetings={meetings}
                                    upcomingMeetings={upcomingMeetings}
                                    onMeetingClick={handleMeetingClick}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* LEFT: Chat or Calendar */}
                        <div className="flex-1 min-w-0">
                            {activeTab === 'chat' ? (
                                <ChatPanel
                                    organizerName={user?.user_metadata.full_name || 'Usuário'}
                                    onConfirmSchedule={handleConfirmSchedule}
                                />
                            ) : (
                                <CalendarComponent
                                    meetings={meetings}
                                    onDateSelect={handleDateSelect}
                                    onMeetingClick={handleMeetingClick}
                                />
                            )}
                        </div>

                        {/* RIGHT: Detailed Stats Panel (desktop only) */}
                        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
                            <div className="sticky top-4 space-y-4 max-h-[calc(100dvh-120px)] overflow-y-auto no-scrollbar">
                                <DetailedStatsPanel
                                    stats={detailedStats}
                                    meetings={meetings}
                                    upcomingMeetings={upcomingMeetings}
                                    onMeetingClick={handleMeetingClick}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ===== MOBILE: Bottom Tab Bar ===== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-white/5 safe-area-bottom">
                <div className="flex items-stretch h-16">
                    {/* Chat first on mobile */}
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5 ${activeTab === 'chat' ? 'text-[#0071eb]' : 'text-gray-500'
                            }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Chat</span>
                    </button>
                    <button
                        onClick={openNewMeeting}
                        className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-white/5"
                    >
                        <div className="w-11 h-11 rounded-full bg-[#0071eb] flex items-center justify-center shadow-lg shadow-[#0071eb]/30 -mt-4">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5 ${activeTab === 'calendar' ? 'text-[#0071eb]' : 'text-gray-500'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Calendário</span>
                    </button>
                </div>
            </nav>

            {/* Modals */}
            <MeetingModal
                isOpen={showMeetingModal}
                onClose={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
                onSave={handleCreateOrUpdate}
                editMeeting={editingMeeting}
                prefilledDate={prefilledDate}
                prefilledTime={prefilledTime}
            />
            <MeetingDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                meeting={selectedMeeting}
                onEdit={(m) => { setShowDetailsModal(false); setEditingMeeting(m); setShowMeetingModal(true); }}
                onCancel={async (m) => {
                    const updated = await updateMeeting(m.id, { status: 'cancelled' });
                    setShowDetailsModal(false);
                    if (user && updated.google_event_id) {
                        const result = await sendWebhook('delete', updated, user);
                        if (result.status === 'success') {
                            showToast('success', '🚫 Evento cancelado e removido do Google Calendar');
                        }
                    } else {
                        showToast('warning', 'Evento cancelado localmente');
                    }
                }}
                onDelete={async (m) => {
                    if (user && m.google_event_id) {
                        const result = await sendWebhook('delete', m, user);
                        if (result.status === 'success') {
                            showToast('success', '🗑️ Evento excluído do Google Calendar');
                        }
                    }
                    await deleteMeeting(m.id);
                    setShowDetailsModal(false);
                }}
                onResendWebhook={async (m) => {
                    if (user) {
                        const result = await sendWebhook('create', m, user);
                        if (result.status === 'success') {
                            await updateWebhookStatus(m.id, true, result.google_event_id, result.meet_link);
                            // Update selectedMeeting so modal reflects meet_link immediately
                            setSelectedMeeting(prev => prev && prev.id === m.id ? {
                                ...prev,
                                webhook_sent: true,
                                google_event_id: result.google_event_id,
                                meet_link: result.meet_link,
                            } : prev);
                            const phrase = getRandomPhrase();
                            showToast('success', '✅ Webhook reenviado!', { meetLink: result.meet_link, subtitle: phrase });
                        } else {
                            showToast('error', 'Erro ao reenviar webhook');
                        }
                    }
                }}
                onComplete={async (m) => {
                    await updateMeeting(m.id, { status: 'completed' });
                    setShowDetailsModal(false);
                    showToast('success', '✅ Reunião concluída!');
                }}
                onPostpone={(m) => {
                    setShowDetailsModal(false);
                    setEditingMeeting(m);
                    setShowMeetingModal(true);
                }}
            />
        </div>
    );
};

export default Dashboard;
