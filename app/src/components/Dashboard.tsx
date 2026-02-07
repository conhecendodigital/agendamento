import React, { useState } from 'react';
import { LogOut, Plus, Calendar, Clock, Users, CalendarCheck, Loader2 } from 'lucide-react';
import { LionLogo } from './LionLogo';
import { Calendar as CalendarComponent } from './Calendar';
import { MeetingModal } from './MeetingModal';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';
import { useMeetings } from '../hooks/useMeetings';
import type { Meeting } from '../hooks/useMeetings';
import { sendWebhook } from '../utils/webhook';
import { formatDateBR, formatTime } from '../utils/dateUtils';

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
                    await updateWebhookStatus(savedMeeting.id, true, webhookResult.google_event_id);
                }
            }
        } catch {
            showToast('error', 'Erro ao salvar');
        }
    };

    const upcomingMeetings = getUpcomingMeetings(5);
    const todayCount = getTodayMeetingsCount();
    const uniqueParticipants = getUniqueParticipantsCount();
    const nextMeeting = getNextMeeting();

    return (
        <div className="min-h-screen bg-black text-gray-200">
            {/* Header - Netflix Style */}
            <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LionLogo size={36} className="text-[#0071eb]" />
                        <span className="text-xl font-bold text-white hidden sm:inline">Valento <span className="text-[#0071eb]">Academy</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-white/5">
                            <div className="w-7 h-7 rounded-full bg-[#0071eb] flex items-center justify-center text-xs font-bold text-white">
                                {(user?.user_metadata.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-300 truncate max-w-[100px]">
                                {user?.user_metadata.full_name?.split(' ')[0]}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                            {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
                {/* Stats Grid - Netflix Style Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { title: 'Total', value: meetings.length, icon: Calendar, color: 'text-[#0071eb]' },
                        { title: 'Hoje', value: todayCount, icon: Clock, color: 'text-[#0071eb]' },
                        { title: 'Próxima', value: nextMeeting ? formatTime(nextMeeting.start_time) : '-', icon: CalendarCheck, color: 'text-[#0071eb]', sub: nextMeeting?.title },
                        { title: 'Participantes', value: uniqueParticipants, icon: Users, color: 'text-[#0071eb]' }
                    ].map((stat, i) => (
                        <div 
                            key={i} 
                            className="bg-[#141414] border border-white/5 p-5 rounded-lg hover:border-[#0071eb]/30 transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-[#222] ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{stat.title}</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-white">{stat.value}</span>
                                {stat.sub && <span className="text-xs text-gray-500 mb-1 truncate max-w-[100px]">{stat.sub}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Calendar */}
                    <div className="flex-1 min-w-0">
                        <CalendarComponent
                            meetings={meetings}
                            onDateSelect={handleDateSelect}
                            onMeetingClick={handleMeetingClick}
                        />
                    </div>

                    {/* Sidebar - Upcoming Meetings */}
                    <div className="w-full lg:w-80">
                        <div className="bg-[#141414] border border-white/5 rounded-lg p-5">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#0071eb]" />
                                Próximos
                            </h3>
                            {upcomingMeetings.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">Nenhum agendamento</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingMeetings.map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => handleMeetingClick(m)}
                                            className="p-3 rounded-lg bg-[#222] hover:bg-[#333] transition-all cursor-pointer border border-transparent hover:border-[#0071eb]/30"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-sm font-medium text-white truncate max-w-[150px]">{m.title}</span>
                                                <span className="text-[10px] bg-[#0071eb]/15 text-[#0071eb] px-1.5 py-0.5 rounded">
                                                    {formatTime(m.start_time)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDateBR(new Date(m.date + 'T12:00:00'))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* FAB - Netflix Blue */}
            <button
                onClick={() => {
                    setEditingMeeting(null);
                    setPrefilledDate(null);
                    setPrefilledTime(null);
                    setShowMeetingModal(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#0071eb] hover:bg-[#0056b3] rounded-full shadow-lg shadow-[#0071eb]/30 flex items-center justify-center text-white hover:scale-110 transition-all z-30 focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
            >
                <Plus className="w-7 h-7" />
            </button>

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
                onCancel={async (m) => { await updateMeeting(m.id, { status: 'cancelled' }); setShowDetailsModal(false); }}
                onDelete={async (m) => { await deleteMeeting(m.id); setShowDetailsModal(false); }}
                onResendWebhook={async () => { }}
            />
        </div>
    );
};

export default Dashboard;
