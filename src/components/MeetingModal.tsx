import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Plus, Calendar, Clock, User } from 'lucide-react';
import type { Meeting } from '../hooks/useMeetings';
import { toDateString } from '../utils/dateUtils';

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meeting: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id'>) => Promise<void>;
    editMeeting?: Meeting | null;
    prefilledDate?: Date | null;
    prefilledTime?: string | null;
}

interface ParticipantEntry {
    name: string;
    email: string;
}

interface FormData {
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    participantEntries: ParticipantEntry[];
}

// Netflix Style Icon Input - OUTSIDE component to prevent focus loss
const IconInput: React.FC<{
    icon: React.ElementType;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ icon: Icon, type = 'text', value, onChange, placeholder, className = '', onKeyDown }) => (
    <div className="relative w-full">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
            type={type}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={`w-full pl-12 pr-4 py-3 bg-[#222] border border-white/10 rounded text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071eb] focus:border-[#0071eb] transition-all ${className}`}
        />
    </div>
);

export const MeetingModal: React.FC<MeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editMeeting,
    prefilledDate,
    prefilledTime
}) => {
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        participantEntries: []
    });
    const [participantName, setParticipantName] = useState('');
    const [participantEmail, setParticipantEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editMeeting) {
                // Reconstruct participant entries from existing data
                const entries: ParticipantEntry[] = editMeeting.participants.map((email, i) => ({
                    name: editMeeting.participant_names?.[i] || '',
                    email
                }));
                setFormData({
                    title: editMeeting.title,
                    description: editMeeting.description || '',
                    date: editMeeting.date,
                    start_time: editMeeting.start_time.slice(0, 5),
                    end_time: editMeeting.end_time.slice(0, 5),
                    participantEntries: entries
                });
            } else {
                const today = new Date();
                const defaultDate = prefilledDate || today;
                const defaultTime = prefilledTime || `${today.getHours().toString().padStart(2, '0')}:00`;
                const endHour = parseInt(defaultTime.split(':')[0]) + 1;
                setFormData({
                    title: '',
                    description: '',
                    date: toDateString(defaultDate),
                    start_time: defaultTime,
                    end_time: `${endHour.toString().padStart(2, '0')}:00`,
                    participantEntries: []
                });
            }
            setParticipantName('');
            setParticipantEmail('');
            setErrors({});
        }
    }, [isOpen, editMeeting, prefilledDate, prefilledTime]);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addParticipant = () => {
        const email = participantEmail.trim().toLowerCase();
        const name = participantName.trim();

        if (!email) {
            setErrors(p => ({ ...p, participant: 'Informe o email' }));
            return;
        }
        if (!validateEmail(email)) {
            setErrors(p => ({ ...p, participant: 'Email inválido' }));
            return;
        }
        if (formData.participantEntries.some(p => p.email === email)) {
            setErrors(p => ({ ...p, participant: 'Email já adicionado' }));
            return;
        }
        setFormData(p => ({
            ...p,
            participantEntries: [...p.participantEntries, { name: name || email.split('@')[0], email }]
        }));
        setParticipantName('');
        setParticipantEmail('');
        setErrors(p => ({ ...p, participant: undefined as any }));
    };

    const removeParticipant = (email: string) => {
        setFormData(p => ({
            ...p,
            participantEntries: p.participantEntries.filter(e => e.email !== email)
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addParticipant();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const meetingPayload = {
                title: formData.title,
                description: formData.description,
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                participants: formData.participantEntries.map(p => p.email),
                participant_names: formData.participantEntries.map(p => p.name),
                status: editMeeting?.status || 'scheduled' as const
            };
            await onSave(meetingPayload);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            {/* Modal - Netflix Style */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#141414] border border-white/10 rounded-lg shadow-2xl animate-fadeInUp">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/5 bg-[#141414]">
                    <h2 className="text-lg font-bold text-white">
                        {editMeeting ? 'Editar Reunião' : 'Nova Reunião'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                            Assunto
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                            placeholder="Ex: Daily Meeting"
                            className="w-full bg-[#222] border border-white/10 rounded py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071eb] focus:border-[#0071eb] transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                            placeholder="Detalhes da reunião..."
                            rows={3}
                            className="w-full bg-[#222] border border-white/10 rounded py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071eb] focus:border-[#0071eb] transition-all resize-none"
                        />
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Data
                            </label>
                            <IconInput
                                icon={Calendar}
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Início
                            </label>
                            <IconInput
                                icon={Clock}
                                type="time"
                                value={formData.start_time}
                                onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Fim
                            </label>
                            <IconInput
                                icon={Clock}
                                type="time"
                                value={formData.end_time}
                                onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Participants */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                            Participantes
                        </label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <IconInput
                                    icon={User}
                                    type="text"
                                    value={participantName}
                                    onChange={e => setParticipantName(e.target.value)}
                                    placeholder="Nome"
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative w-full flex-1">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={participantEmail}
                                        onChange={e => setParticipantEmail(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="email@exemplo.com"
                                        className="w-full pl-12 pr-4 py-3 bg-[#222] border border-white/10 rounded text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0071eb] focus:border-[#0071eb] transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addParticipant}
                                    className="px-4 py-2 bg-[#0071eb]/20 text-[#0071eb] rounded hover:bg-[#0071eb]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071eb]"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {errors.participant && (
                            <span className="text-xs text-[#e50914] mt-1 block">{errors.participant}</span>
                        )}
                        {formData.participantEntries.length > 0 && (
                            <div className="flex flex-col gap-2 mt-3">
                                {formData.participantEntries.map(({ name, email }) => (
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
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(email)}
                                            className="hover:text-[#e50914] text-gray-500 transition-colors flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-white/10 text-gray-300 rounded hover:bg-white/5 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#0071eb] hover:bg-[#0056b3] text-white rounded py-3 px-4 font-bold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0071eb] disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editMeeting ? 'Salvar' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingModal;
