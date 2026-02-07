import React from 'react';
import { X, Edit, Trash2, XCircle, Calendar, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import type { Meeting } from '../hooks/useMeetings';
import { formatDateFull, formatTime } from '../utils/dateUtils';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            {/* Modal - Netflix Style */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#141414] border border-white/10 rounded-lg shadow-2xl animate-fadeInUp">
                {/* Netflix Blue Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0071eb] rounded-t-lg" />

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-start justify-between p-5 border-b border-white/5 bg-[#141414]">
                    <div className="flex-1 pr-4">
                        <div className="mb-3">{getStatusBadge()}</div>
                        <h2 className="text-xl font-bold text-white line-clamp-2">{meeting.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
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
                        <div className="flex flex-wrap gap-2">
                            {meeting.participants.map(email => (
                                <div
                                    key={email}
                                    className="flex items-center gap-2 bg-[#222] border border-white/5 px-3 py-2 rounded-full text-sm"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0071eb] flex items-center justify-center text-white text-[10px] font-bold">
                                        {email.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-gray-300 truncate max-w-[120px]">{email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Webhook Status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#222] border border-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            {meeting.webhook_sent ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-[#46d369] flex-shrink-0" />
                                    <div>
                                        <span className="text-gray-300 text-sm">Webhook enviado</span>
                                        {meeting.google_event_id && (
                                            <p className="text-xs text-gray-500 mt-0.5">Sincronizado com Google Calendar</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-[#f5c518] flex-shrink-0" />
                                    <span className="text-gray-300 text-sm">Webhook não enviado</span>
                                </>
                            )}
                        </div>
                        {!meeting.webhook_sent && (
                            <button
                                onClick={() => onResendWebhook(meeting)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#0071eb]/20 text-[#0071eb] rounded-lg hover:bg-[#0071eb]/30 border border-[#0071eb]/30 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                            >
                                <RefreshCw className="w-4 h-4" />Reenviar
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 p-5 pt-0">
                    {meeting.status !== 'cancelled' && (
                        <>
                            <button
                                onClick={() => { onClose(); onEdit(meeting); }}
                                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#222] text-white border border-white/10 rounded-lg hover:bg-[#333] transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                            >
                                <Edit className="w-4 h-4" />Editar
                            </button>
                            <button
                                onClick={() => onCancel(meeting)}
                                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#f5c518]/20 text-[#f5c518] border border-[#f5c518]/30 rounded-lg hover:bg-[#f5c518]/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                            >
                                <XCircle className="w-4 h-4" />Cancelar
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onDelete(meeting)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30 rounded-lg hover:bg-[#e50914]/30 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#e50914] ${meeting.status === 'cancelled' ? 'flex-1' : ''}`}
                    >
                        <Trash2 className="w-4 h-4" />Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailsModal;
