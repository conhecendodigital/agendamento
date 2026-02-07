import React from 'react';
import { X, Edit, Trash2, XCircle, Calendar, Clock, RefreshCw, CheckCircle, AlertCircle, Video } from 'lucide-react';
import type { Meeting } from '../hooks/useMeetings';
import { formatDateFull, formatTime } from '../utils/dateUtils';
import { getRandomPhrase } from '../utils/motivationalPhrases';

interface MeetingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
    onEdit: (meeting: Meeting) => void;
    onCancel: (meeting: Meeting) => void;
    onDelete: (meeting: Meeting) => void;
    onResendWebhook: (meeting: Meeting) => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
    isOpen,
    onClose,
    meeting,
    onEdit,
    onCancel,
    onDelete,
    onResendWebhook
}) => {
    if (!isOpen || !meeting) return null;

    // Netflix Style Status Badge
    const getStatusBadge = () => {
        if (meeting.status === 'scheduled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0071eb]/20 text-[#0071eb] border border-[#0071eb]/30 rounded-full text-sm">
                    <Calendar className="w-4 h-4" />Agendada
                </span>
            );
        }
        if (meeting.status === 'completed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#46d369]/20 text-[#46d369] border border-[#46d369]/30 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />Concluída
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30 rounded-full text-sm">
                <XCircle className="w-4 h-4" />Cancelada
            </span>
        );
    };

    const meetingDate = new Date(meeting.date + 'T12:00:00');

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            {/* Modal - Netflix Style — fullscreen on mobile */}
            <div className="relative w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-[#141414] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-lg shadow-2xl animate-fadeInUp">
                {/* Netflix Blue Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0071eb] rounded-t-lg" />

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-start justify-between p-4 sm:p-5 border-b border-white/5 bg-[#141414]">
                    <div className="flex-1 pr-4">
                        <div className="mb-3">{getStatusBadge()}</div>
                        <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2">{meeting.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 sm:p-2 rounded-lg hover:bg-white/5 active:bg-white/10 border border-transparent hover:border-white/10 transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                    {/* Date/Time */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="p-2 rounded-lg bg-[#0071eb]/10">
                                <Calendar className="w-5 h-5 text-[#0071eb]" />
                            </div>
                            <span>{formatDateFull(meetingDate)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="p-2 rounded-lg bg-[#0071eb]/10">
                                <Clock className="w-5 h-5 text-[#0071eb]" />
                            </div>
                            <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {meeting.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Descrição</h3>
                            <p className="text-gray-300 bg-[#222] border border-white/5 rounded-lg p-4">
                                {meeting.description}
                            </p>
                        </div>
                    )}

                    {/* Participants */}
                    <div>
                        <h3 className="text-sm font-medium text-[#0071eb] mb-3">
                            Participantes ({meeting.participants.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {meeting.participants.map((email, i) => {
                                const name = meeting.participant_names?.[i] || email.split('@')[0];
                                return (
                                    <div
                                        key={email}
                                        className="flex items-center gap-3 bg-[#222] border border-white/5 px-3 py-2 rounded-lg text-sm"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[#0071eb] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                            {name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{name}</p>
                                            <p className="text-gray-500 text-xs truncate">{email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meet Link & Motivational */}
                    {meeting.webhook_sent ? (
                        <div className="space-y-3">
                            {meeting.meet_link && (
                                <a
                                    href={meeting.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-[#0071eb]/10 hover:bg-[#0071eb]/20 border border-[#0071eb]/30 rounded-lg px-4 py-3 transition-all group"
                                >
                                    <Video className="w-5 h-5 text-[#0071eb] group-hover:text-white transition-colors flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#0071eb] group-hover:text-white transition-colors">Entrar na Reunião</p>
                                        <p className="text-xs text-gray-500 truncate">{meeting.meet_link}</p>
                                    </div>
                                </a>
                            )}
                            <div className="flex items-center gap-3 bg-[#222] border border-white/5 rounded-lg px-4 py-3">
                                <CheckCircle className="w-5 h-5 text-[#46d369] flex-shrink-0" />
                                <p className="text-gray-400 text-sm italic">{getRandomPhrase()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#222] border border-white/5 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-[#f5c518] flex-shrink-0" />
                                <span className="text-gray-300 text-sm">Aguardando sincronização</span>
                            </div>
                            <button
                                onClick={() => onResendWebhook(meeting)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#0071eb]/20 text-[#0071eb] rounded-lg hover:bg-[#0071eb]/30 border border-[#0071eb]/30 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                            >
                                <RefreshCw className="w-4 h-4" />Sincronizar
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 p-4 sm:p-5 pt-0 pb-safe">
                    {meeting.status !== 'cancelled' && (
                        <>
                            <button
                                onClick={() => { onClose(); onEdit(meeting); }}
                                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 sm:py-2.5 px-4 bg-[#222] text-white border border-white/10 rounded-lg hover:bg-[#333] active:bg-[#3a3a3a] transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                            >
                                <Edit className="w-4 h-4" />Editar
                            </button>
                            <button
                                onClick={() => onCancel(meeting)}
                                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 sm:py-2.5 px-4 bg-[#f5c518]/20 text-[#f5c518] border border-[#f5c518]/30 rounded-lg hover:bg-[#f5c518]/30 active:bg-[#f5c518]/40 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                            >
                                <XCircle className="w-4 h-4" />Cancelar
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onDelete(meeting)}
                        className={`flex items-center justify-center gap-2 py-3 sm:py-2.5 px-4 bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30 rounded-lg hover:bg-[#e50914]/30 active:bg-[#e50914]/40 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#e50914] ${meeting.status === 'cancelled' ? 'flex-1' : ''}`}
                    >
                        <Trash2 className="w-4 h-4" />Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailsModal;
