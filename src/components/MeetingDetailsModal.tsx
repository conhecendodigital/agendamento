import React from 'react';
import { X, Edit, Trash2, XCircle, Mail, Calendar, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import type { Meeting } from '../config/supabase';
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
    onResendWebhook,
}) => {
    if (!isOpen || !meeting) return null;

    const getStatusBadge = () => {
        switch (meeting.status) {
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                        <Calendar className="w-4 h-4" />
                        Agendada
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Concluída
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                        <XCircle className="w-4 h-4" />
                        Cancelada
                    </span>
                );
        }
    };

    const meetingDate = new Date(meeting.date + 'T12:00:00');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-700">
                    <div className="flex-1 pr-4">
                        <h2 className="text-xl font-bold text-white mb-2">{meeting.title}</h2>
                        {getStatusBadge()}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 space-y-5">
                    {/* Data e horário */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-3 text-slate-300">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <span>{formatDateFull(meetingDate)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <span>{formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}</span>
                        </div>
                    </div>

                    {/* Descrição */}
                    {meeting.description && (
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Descrição</h3>
                            <p className="text-slate-300 bg-slate-900/50 rounded-lg p-3">{meeting.description}</p>
                        </div>
                    )}

                    {/* Participantes */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2">
                            Participantes ({meeting.participants.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {meeting.participants.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full text-sm"
                                >
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-slate-300">{email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status de sincronização */}
                    <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            {meeting.webhook_sent ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <span className="text-slate-300 text-sm">Webhook enviado</span>
                                        {meeting.google_event_id && (
                                            <p className="text-xs text-slate-500 mt-0.5">Sincronizado com Google Calendar</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    <span className="text-slate-300 text-sm">Webhook não enviado</span>
                                </>
                            )}
                        </div>
                        {!meeting.webhook_sent && (
                            <button
                                onClick={() => onResendWebhook(meeting)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reenviar
                            </button>
                        )}
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 p-6 pt-0">
                    {meeting.status !== 'cancelled' && (
                        <>
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(meeting);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </button>
                            <button
                                onClick={() => onCancel(meeting)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Cancelar
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onDelete(meeting)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailsModal;
