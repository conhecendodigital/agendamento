import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Plus, Calendar, Clock } from 'lucide-react';
import type { Meeting } from '../config/supabase';
import { formatDateBR, toDateString } from '../utils/dateUtils';

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (meeting: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'webhook_sent' | 'google_event_id'>) => Promise<void>;
    editMeeting?: Meeting | null;
    prefilledDate?: Date | null;
    prefilledTime?: string | null;
}

interface FormData {
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    participants: string[];
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editMeeting,
    prefilledDate,
    prefilledTime,
}) => {
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        participants: [],
    });
    const [participantInput, setParticipantInput] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'participant', string>>>({});
    const [loading, setSaving] = useState(false);

    // Preencher formulário quando abrir
    useEffect(() => {
        if (isOpen) {
            if (editMeeting) {
                setFormData({
                    title: editMeeting.title,
                    description: editMeeting.description || '',
                    date: editMeeting.date,
                    start_time: editMeeting.start_time.slice(0, 5),
                    end_time: editMeeting.end_time.slice(0, 5),
                    participants: editMeeting.participants,
                });
            } else {
                const today = new Date();
                const defaultDate = prefilledDate || today;
                const defaultTime = prefilledTime || `${today.getHours().toString().padStart(2, '0')}:00`;
                const endHour = parseInt(defaultTime.split(':')[0]) + 1;
                const defaultEndTime = `${endHour.toString().padStart(2, '0')}:00`;

                setFormData({
                    title: '',
                    description: '',
                    date: toDateString(defaultDate),
                    start_time: defaultTime,
                    end_time: defaultEndTime,
                    participants: [],
                });
            }
            setParticipantInput('');
            setErrors({});
        }
    }, [isOpen, editMeeting, prefilledDate, prefilledTime]);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const addParticipant = () => {
        const email = participantInput.trim().toLowerCase();

        if (!email) return;

        if (!validateEmail(email)) {
            setErrors((prev) => ({ ...prev, participant: 'Email inválido' }));
            return;
        }

        if (formData.participants.includes(email)) {
            setErrors((prev) => ({ ...prev, participant: 'Email já adicionado' }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            participants: [...prev.participants, email],
        }));
        setParticipantInput('');
        setErrors((prev) => ({ ...prev, participant: undefined }));
    };

    const removeParticipant = (email: string) => {
        setFormData((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p !== email),
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addParticipant();
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Título é obrigatório';
        }

        if (!formData.date) {
            newErrors.date = 'Data é obrigatória';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today && !editMeeting) {
                newErrors.date = 'Não é possível agendar para datas passadas';
            }
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Horário de início é obrigatório';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Horário de fim é obrigatório';
        } else if (formData.start_time && formData.end_time <= formData.start_time) {
            newErrors.end_time = 'Horário de fim deve ser após o início';
        }

        if (formData.participants.length === 0) {
            newErrors.participants = 'Adicione pelo menos um participante';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);

        try {
            await onSave({
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                participants: formData.participants,
                status: editMeeting?.status || 'scheduled',
            });
            onClose();
        } catch (error) {
            console.error('Erro ao salvar reunião:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">
                        {editMeeting ? 'Editar Reunião' : 'Nova Reunião'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Título */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1.5">
                            Assunto *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: Reunião de alinhamento semanal"
                            className={`w-full bg-slate-900/50 border rounded-lg py-3 px-4 text-white placeholder-slate-500 transition-all ${errors.title ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                                }`}
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Descrição */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1.5">
                            Descrição
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Descreva o objetivo da reunião..."
                            rows={3}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:border-amber-500 transition-all resize-none"
                        />
                    </div>

                    {/* Data e Horários */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Data */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1.5">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Data *
                            </label>
                            <input
                                type="date"
                                id="date"
                                value={formData.date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                                min={!editMeeting ? toDateString(new Date()) : undefined}
                                className={`w-full bg-slate-900/50 border rounded-lg py-3 px-4 text-white transition-all ${errors.date ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                                    }`}
                            />
                            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                        </div>

                        {/* Horário início */}
                        <div>
                            <label htmlFor="start_time" className="block text-sm font-medium text-slate-300 mb-1.5">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Início *
                            </label>
                            <input
                                type="time"
                                id="start_time"
                                value={formData.start_time}
                                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                                className={`w-full bg-slate-900/50 border rounded-lg py-3 px-4 text-white transition-all ${errors.start_time ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                                    }`}
                            />
                            {errors.start_time && <p className="text-red-400 text-xs mt-1">{errors.start_time}</p>}
                        </div>

                        {/* Horário fim */}
                        <div>
                            <label htmlFor="end_time" className="block text-sm font-medium text-slate-300 mb-1.5">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Fim *
                            </label>
                            <input
                                type="time"
                                id="end_time"
                                value={formData.end_time}
                                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                                className={`w-full bg-slate-900/50 border rounded-lg py-3 px-4 text-white transition-all ${errors.end_time ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                                    }`}
                            />
                            {errors.end_time && <p className="text-red-400 text-xs mt-1">{errors.end_time}</p>}
                        </div>
                    </div>

                    {/* Participantes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Participantes *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={participantInput}
                                onChange={(e) => {
                                    setParticipantInput(e.target.value);
                                    setErrors((prev) => ({ ...prev, participant: undefined }));
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="email@exemplo.com"
                                className={`flex-1 bg-slate-900/50 border rounded-lg py-3 px-4 text-white placeholder-slate-500 transition-all ${errors.participant ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={addParticipant}
                                className="px-4 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        {errors.participant && <p className="text-red-400 text-xs mt-1">{errors.participant}</p>}
                        {errors.participants && <p className="text-red-400 text-xs mt-1">{errors.participants}</p>}

                        {/* Lista de participantes */}
                        {formData.participants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.participants.map((email) => (
                                    <div
                                        key={email}
                                        className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full text-sm"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-slate-300">{email}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(email)}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary py-3 px-4 rounded-lg text-slate-900 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Salvando...
                                </>
                            ) : editMeeting ? (
                                'Salvar Alterações'
                            ) : (
                                'Agendar Reunião'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingModal;
