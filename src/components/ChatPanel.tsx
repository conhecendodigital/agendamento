import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Video, Sparkles, Loader2, Calendar, Clock, Mail, FileText, Check, X } from 'lucide-react';
import { parseMeetingFromText, getMissingFieldsMessage, type ParsedMeeting } from '../utils/meetingParser';
import { formatTime } from '../utils/dateUtils';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    meetLink?: string;
    confirmationData?: ParsedMeeting;
    timestamp: Date;
}

type ChatState = 'idle' | 'processing' | 'confirming' | 'sending' | 'success' | 'error';

interface ChatPanelProps {
    onConfirmSchedule: (data: ParsedMeeting) => Promise<{
        status: string;
        message?: string;
        meet_link?: string;
        google_event_id?: string;
    }>;
    organizerName: string;
}

const SUGGESTIONS = [
    '📅 Reunião amanhã às 14h sobre projeto',
    '📧 Call com gui@email.com segunda 10h',
    '🗓️ Agendar para sexta 16h revisão',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ onConfirmSchedule, organizerName }) => {
    const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Olá ${organizerName.split(' ')[0]}! 👋 Sou seu assistente de agendamento.\n\nMe conte sobre a reunião:\n• 📧 Com quem? (email)\n• 📅 Quando? (data e horário)\n• 📝 Qual o assunto?`,
        timestamp: new Date(),
    };

    const [messages, setMessages] = useState<ChatMessage[]>([welcomeMsg]);
    const [input, setInput] = useState('');
    const [chatState, setChatState] = useState<ChatState>('idle');
    const [pendingMeeting, setPendingMeeting] = useState<ParsedMeeting | null>(null);
    const [conversationContext, setConversationContext] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    useEffect(scrollToBottom, [messages]);

    const addMessage = (role: 'user' | 'assistant', content: string, extras?: Partial<ChatMessage>) => {
        const msg: ChatMessage = { id: Date.now().toString() + Math.random(), role, content, timestamp: new Date(), ...extras };
        setMessages(prev => [...prev, msg]);
        return msg;
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || chatState === 'sending') return;

        addMessage('user', text);
        setInput('');
        if (inputRef.current) inputRef.current.style.height = '44px';

        // Accumulate context from all messages
        const fullContext = conversationContext + ' ' + text;
        setConversationContext(fullContext);

        setChatState('processing');

        // Small delay for UX
        await new Promise(r => setTimeout(r, 400));

        const parsed = parseMeetingFromText(fullContext);

        if (parsed.ready) {
            // All data extracted — show confirmation card
            setPendingMeeting(parsed);
            setChatState('confirming');
            addMessage('assistant', 'Entendi! Confira os dados:', { confirmationData: parsed });
        } else {
            // Missing info — ask for it
            setChatState('idle');
            addMessage('assistant', getMissingFieldsMessage(parsed.missing));
        }
    };

    const handleConfirm = async () => {
        if (!pendingMeeting) return;
        setChatState('sending');
        addMessage('assistant', '⏳ Agendando no Google Calendar...');

        try {
            const result = await onConfirmSchedule(pendingMeeting);

            if (result.status === 'success') {
                setChatState('success');
                addMessage('assistant', `✅ ${result.message || 'Reunião agendada com sucesso!'}`, { meetLink: result.meet_link });

                if (pendingMeeting.participants.length > 0) {
                    addMessage('assistant', `📧 Convite enviado para: ${pendingMeeting.participants.join(', ')}`);
                }

                // Reset for next conversation
                setTimeout(() => {
                    setPendingMeeting(null);
                    setConversationContext('');
                    setChatState('idle');
                }, 1500);
            } else {
                setChatState('error');
                addMessage('assistant', `❌ ${result.message || 'Erro ao agendar. Tente novamente.'}`);
                setPendingMeeting(null);
            }
        } catch {
            setChatState('error');
            addMessage('assistant', '❌ Erro de conexão. Tente novamente.');
            setPendingMeeting(null);
        }
    };

    const handleCancel = () => {
        setChatState('idle');
        setPendingMeeting(null);
        addMessage('assistant', 'Ok, cancelado! Me conte novamente os dados da reunião. 😊');
        setConversationContext('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = '44px';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    };

    const fmtTime = (t: string) => t ? formatTime(t.replace(/:00$/, '')) : '';

    // =================== RENDER ===================
    return (
        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 200px)', minHeight: '400px' }}>
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5 bg-gradient-to-r from-[#0f0f0f] to-[#141414]">
                <div className="relative">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4facfe] flex items-center justify-center shadow-lg shadow-[#1a73e8]/25">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#141414]" />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        Agenda AI
                        <span className="text-[10px] bg-[#1a73e8]/20 text-[#4facfe] px-2 py-0.5 rounded-full font-medium">BETA</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">Agendar reuniões por chat</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5 space-y-3 sm:space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a73e8]/30 to-[#4facfe]/20 flex items-center justify-center flex-shrink-0 mt-1 border border-[#1a73e8]/20">
                                <Bot className="w-4 h-4 text-[#4facfe]" />
                            </div>
                        )}
                        <div className={`max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                            {/* Text bubble */}
                            {!msg.confirmationData && (
                                <div className={`
                                    px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                    ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-white rounded-br-md shadow-lg shadow-[#1a73e8]/15'
                                        : 'bg-[#1e1e1e] text-gray-200 rounded-bl-md border border-white/5'
                                    }
                                `}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line.startsWith('**') && line.endsWith('**')
                                                ? <strong className="font-semibold">{line.replace(/\*\*/g, '')}</strong>
                                                : line.startsWith('• ')
                                                    ? <span className="block pl-1">{line}</span>
                                                    : line
                                            }
                                            {i < msg.content.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}

                            {/* ===== CONFIRMATION CARD ===== */}
                            {msg.confirmationData && (
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                                    <div className="bg-gradient-to-r from-[#1a73e8]/10 to-transparent px-4 py-3 border-b border-white/5">
                                        <p className="text-sm font-medium text-white flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#4facfe]" />
                                            Confirme os dados da reunião
                                        </p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-4 h-4 text-[#4facfe] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assunto</p>
                                                <p className="text-sm text-white font-medium">{msg.confirmationData.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-4 h-4 text-[#4facfe] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Participante(s)</p>
                                                {msg.confirmationData.participants.map((p, i) => (
                                                    <p key={i} className="text-sm text-white">{msg.confirmationData!.participant_names[i]} <span className="text-gray-500">({p})</span></p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-4 h-4 text-[#4facfe] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Data</p>
                                                <p className="text-sm text-white">{msg.confirmationData.dateLabel}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-4 h-4 text-[#4facfe] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Horário</p>
                                                <p className="text-sm text-white">{fmtTime(msg.confirmationData.start_time)} – {fmtTime(msg.confirmationData.end_time)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    {chatState === 'confirming' && (
                                        <div className="px-4 pb-4 flex gap-2">
                                            <button
                                                onClick={handleConfirm}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-[#1a73e8]/20 active:scale-[0.98]"
                                            >
                                                <Check className="w-4 h-4" />
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#222] text-gray-400 text-sm font-medium hover:bg-[#333] hover:text-white transition-all border border-white/5"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Meet Link */}
                            {msg.meetLink && (
                                <a
                                    href={msg.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1a73e8]/10 to-[#4facfe]/5 border border-[#1a73e8]/30 hover:border-[#1a73e8]/50 hover:bg-[#1a73e8]/15 transition-all group"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-[#1a73e8]/20 flex items-center justify-center group-hover:bg-[#1a73e8]/30 transition-colors">
                                        <Video className="w-5 h-5 text-[#4facfe]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-[#4facfe]">🎥 Entrar na Reunião</p>
                                        <p className="text-[10px] text-gray-500 truncate group-hover:text-gray-400 transition-colors">{msg.meetLink}</p>
                                    </div>
                                </a>
                            )}

                            <p className={`text-[10px] mt-1 px-1 ${msg.role === 'user' ? 'text-right text-gray-600' : 'text-gray-600'}`}>
                                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0071eb] to-[#0056b3] flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-[#0071eb]/20">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {chatState === 'processing' && (
                    <div className="flex gap-3 justify-start animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-[#1a73e8]/20 flex items-center justify-center flex-shrink-0 border border-[#1a73e8]/20">
                            <Bot className="w-4 h-4 text-[#4facfe]" />
                        </div>
                        <div className="bg-[#1e1e1e] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1.5 items-center">
                                <div className="w-2 h-2 rounded-full bg-[#4facfe]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#4facfe]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#4facfe]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Sending indicator */}
                {chatState === 'sending' && (
                    <div className="flex gap-3 justify-start animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-[#1a73e8]/20 flex items-center justify-center flex-shrink-0 border border-[#1a73e8]/20">
                            <Bot className="w-4 h-4 text-[#4facfe]" />
                        </div>
                        <div className="bg-[#1e1e1e] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-[#4facfe] animate-spin" />
                            <span className="text-sm text-gray-400">Agendando no Google Calendar...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && chatState === 'idle' && (
                <div className="px-3 sm:px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => { setInput(s.replace(/^[📅📧🗓️]\s+/, '')); inputRef.current?.focus(); }}
                            className="text-xs px-3 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/5 text-gray-400 hover:text-white active:bg-[#1a73e8]/10 hover:border-[#1a73e8]/30 hover:bg-[#1a73e8]/5 transition-all whitespace-nowrap flex-shrink-0"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="px-3 sm:px-4 py-3 border-t border-white/5 bg-[#0f0f0f]">
                <div className={`flex items-end gap-2 bg-[#1a1a1a] rounded-2xl border transition-colors px-3 sm:px-4 py-1 ${chatState === 'confirming' ? 'border-white/5 opacity-50' : 'border-white/10 focus-within:border-[#1a73e8]/50'
                    }`}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            chatState === 'confirming'
                                ? 'Confirme ou cancele antes de continuar...'
                                : 'Ex: Reunião com email@email.com amanhã 14h sobre projeto...'
                        }
                        rows={1}
                        disabled={chatState === 'sending' || chatState === 'confirming'}
                        className="flex-1 bg-transparent text-white text-[16px] sm:text-sm placeholder-gray-600 resize-none outline-none py-2.5 max-h-[120px]"
                        style={{ height: '44px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || chatState === 'sending' || chatState === 'confirming'}
                        className={`
                            p-2.5 rounded-xl transition-all flex-shrink-0 mb-0.5
                            ${input.trim() && chatState !== 'sending' && chatState !== 'confirming'
                                ? 'bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-white hover:brightness-110 shadow-lg shadow-[#1a73e8]/20 active:scale-95'
                                : 'text-gray-700 cursor-not-allowed'
                            }
                        `}
                    >
                        {chatState === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-700 mt-1.5 text-center hidden sm:block">
                    Enter para enviar • Shift+Enter para nova linha
                </p>
            </div>
        </div>
    );
};

export default ChatPanel;
