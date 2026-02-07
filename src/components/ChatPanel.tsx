import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Video, Sparkles, Loader2, Calendar, Clock, Mail, FileText, Check, X, Zap, Trash2 } from 'lucide-react';
import { parseMeetingFromText, getMissingFieldsMessage, type ParsedMeeting } from '../utils/meetingParser';
import { GrokService } from '../services/grokService';
import { isGrokConfigured } from '../config/grok';
import { formatTime } from '../utils/dateUtils';
import {
    saveConversationHistory,
    loadConversationHistory,
    clearConversationHistory,
    saveContacts,
    type HistoryMessage,
} from '../utils/agentMemory';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    meetLink?: string;
    confirmationData?: ParsedMeeting;
    timestamp: Date;
}

type ChatState = 'idle' | 'processing' | 'confirming' | 'sending' | 'success' | 'error';
type ParserMode = 'grok' | 'local';

interface ChatPanelProps {
    onConfirmSchedule: (data: ParsedMeeting) => Promise<{
        status: string;
        message?: string;
        meet_link?: string;
        google_event_id?: string;
    }>;
    organizerName: string;
}

const SUGGESTIONS_GROK = [
    '👋 Quero agendar uma reunião',
    '📅 Tenho uma call amanhã às 14h',
    '📧 Preciso marcar com fulano@email.com',
];

const SUGGESTIONS_LOCAL = [
    '📅 Reunião amanhã às 14h sobre projeto',
    '📧 Call com gui@email.com segunda 10h',
    '🗓️ Agendar para sexta 16h revisão',
];

// ===== Confidence Badge =====
const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
    const color = confidence >= 0.8
        ? 'text-green-400 bg-green-400/10 border-green-400/20'
        : confidence >= 0.6
            ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
            : 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    const label = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Média' : 'Baixa';

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label} {Math.round(confidence * 100)}%
        </span>
    );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ onConfirmSchedule, organizerName }) => {
    const firstName = organizerName.split(' ')[0];

    const grokWelcome = `Olá ${firstName}! 👋 Sou a Agenda AI, sua assistente de agendamento da Valento Academy.\n\nComo posso te ajudar? Me conte sobre a reunião que precisa agendar! 😊`;
    const localWelcome = `Olá ${firstName}! 👋 Sou seu assistente de agendamento.\n\nMe conte sobre a reunião:\n• 📧 Com quem? (email)\n• 📅 Quando? (data e horário)\n• 📝 Qual o assunto?`;

    const grokConfigured = isGrokConfigured();
    const [parserMode, setParserMode] = useState<ParserMode>(grokConfigured ? 'grok' : 'local');

    const makeWelcome = (mode: ParserMode): ChatMessage => ({
        id: 'welcome',
        role: 'assistant',
        content: mode === 'grok' ? grokWelcome : localWelcome,
        timestamp: new Date(),
    });

    const [messages, setMessages] = useState<ChatMessage[]>([makeWelcome(parserMode)]);
    const [input, setInput] = useState('');
    const [chatState, setChatState] = useState<ChatState>('idle');
    const [pendingMeeting, setPendingMeeting] = useState<ParsedMeeting | null>(null);

    // Local parser context
    const [conversationContext, setConversationContext] = useState('');

    // Grok conversation history (role + content for API calls)
    const [grokHistory, setGrokHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

    const [isProcessingWithGrok, setIsProcessingWithGrok] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    useEffect(scrollToBottom, [messages]);

    // ===== MEMORY: Load conversation history on mount =====
    useEffect(() => {
        if (parserMode !== 'grok') return;
        const saved = loadConversationHistory();
        if (saved.length > 0) {
            // Restore conversation messages to UI
            const restored: ChatMessage[] = [makeWelcome('grok')];
            saved.forEach(m => {
                restored.push({
                    id: `restored-${m.timestamp}`,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.timestamp),
                });
            });
            setMessages(restored);
            // Restore history for API calls
            setGrokHistory(saved.map(m => ({ role: m.role, content: m.content })));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== MEMORY: Save conversation history when grokHistory changes =====
    useEffect(() => {
        if (grokHistory.length > 0) {
            const historyWithTimestamps: HistoryMessage[] = grokHistory.map(m => ({
                ...m,
                timestamp: Date.now(),
            }));
            saveConversationHistory(historyWithTimestamps);
        }
    }, [grokHistory]);

    // Clear conversation memory
    const handleClearMemory = () => {
        clearConversationHistory();
        setMessages([makeWelcome(parserMode)]);
        setGrokHistory([]);
        setConversationContext('');
        setPendingMeeting(null);
        setChatState('idle');
    };

    // Switch parser mode → reset conversation
    const switchMode = (mode: ParserMode) => {
        if (mode === parserMode) return;
        setParserMode(mode);
        setMessages([makeWelcome(mode)]);
        setGrokHistory([]);
        setConversationContext('');
        setPendingMeeting(null);
        setChatState('idle');
    };

    const addMessage = (role: 'user' | 'assistant', content: string, extras?: Partial<ChatMessage>) => {
        const msg: ChatMessage = { id: Date.now().toString() + Math.random(), role, content, timestamp: new Date(), ...extras };
        setMessages(prev => [...prev, msg]);
        return msg;
    };

    // ============ HANDLE SEND ============
    const handleSend = async () => {
        const text = input.trim();
        if (!text || chatState === 'sending' || chatState === 'confirming') return;

        addMessage('user', text);
        setInput('');
        if (inputRef.current) inputRef.current.style.height = '44px';

        setChatState('processing');

        if (parserMode === 'grok') {
            await handleGrokSend(text);
        } else {
            await handleLocalSend(text);
        }
    };

    // ============ GROK FLOW (conversational) ============
    const handleGrokSend = async (text: string) => {
        setIsProcessingWithGrok(true);

        try {
            const result = await GrokService.chat(
                grokHistory.map(m => GrokService.toHistoryMessage(m.role, m.content)),
                text
            );

            // Update conversation history
            setGrokHistory(prev => [
                ...prev,
                { role: 'user', content: text },
            ]);

            if (result.type === 'meeting' && result.meeting) {
                // Grok collected all data → show confirmation
                const meeting = result.meeting;
                setPendingMeeting(meeting);
                setChatState('confirming');
                addMessage('assistant', '✨ Perfeito! Tenho tudo que preciso. Confira os dados:', { confirmationData: meeting });

                setGrokHistory(prev => [
                    ...prev,
                    { role: 'assistant', content: 'Dados completos coletados. Mostrando card de confirmação.' },
                ]);
            } else {
                // Grok is still chatting → show the message
                const msg = result.message || 'Me conte mais sobre a reunião!';
                setChatState('idle');
                addMessage('assistant', msg);

                setGrokHistory(prev => [
                    ...prev,
                    { role: 'assistant', content: msg },
                ]);
            }
        } catch (error) {
            console.error('❌ Grok error:', error);
            setChatState('idle');
            addMessage('assistant', '⚠️ Grok indisponível no momento. Tente novamente ou use o modo Local.');
        } finally {
            setIsProcessingWithGrok(false);
        }
    };

    // ============ LOCAL FLOW (one-shot extraction) ============
    const handleLocalSend = async (text: string) => {
        setIsProcessingWithGrok(false);
        await new Promise(r => setTimeout(r, 400));

        const fullContext = conversationContext + ' ' + text;
        setConversationContext(fullContext);

        const parsed = parseMeetingFromText(fullContext);

        if (parsed.ready) {
            setPendingMeeting(parsed);
            setChatState('confirming');
            addMessage('assistant', '👍 Entendi! Confira os dados:', { confirmationData: parsed });
        } else {
            setChatState('idle');
            addMessage('assistant', getMissingFieldsMessage(parsed.missing));
        }
    };

    // ============ CONFIRM / CANCEL ============
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

                // ===== MEMORY: Save contacts on successful schedule =====
                saveContacts(pendingMeeting.participants, pendingMeeting.participant_names);

                setTimeout(() => {
                    setPendingMeeting(null);
                    setConversationContext('');
                    setGrokHistory([]);
                    clearConversationHistory();
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
        if (parserMode === 'grok') {
            addMessage('assistant', 'Ok, cancelado! Me conte novamente os dados ou se quiser ajustar algo. 😊');
            // Keep history so Grok remembers the context
        } else {
            addMessage('assistant', 'Ok, cancelado! Me conte novamente os dados da reunião. 😊');
            setConversationContext('');
        }
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
    const suggestions = parserMode === 'grok' ? SUGGESTIONS_GROK : SUGGESTIONS_LOCAL;

    // =================== RENDER ===================
    return (
        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 200px)', minHeight: '400px' }}>
            {/* Header with Grok/Local toggle */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5 bg-gradient-to-r from-[#0f0f0f] to-[#141414]">
                <div className="relative">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg ${parserMode === 'grok'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-400 shadow-purple-500/25'
                        : 'bg-gradient-to-br from-[#1a73e8] to-[#4facfe] shadow-[#1a73e8]/25'
                        }`}>
                        {parserMode === 'grok'
                            ? <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        }
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#141414]" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        Agenda AI
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${parserMode === 'grok'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-[#1a73e8]/20 text-[#4facfe]'
                            }`}>
                            {parserMode === 'grok' ? '⚡ GROK' : '💻 LOCAL'}
                        </span>
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate">
                        {parserMode === 'grok' ? 'Agente conversacional xAI' : 'Parser local PT-BR'}
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center bg-[#0f0f0f] rounded-lg border border-white/5 p-0.5">
                    <button
                        onClick={() => switchMode('grok')}
                        disabled={!grokConfigured}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${parserMode === 'grok'
                            ? 'bg-purple-500/20 text-purple-300 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            } ${!grokConfigured ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={!grokConfigured ? 'API key não configurada' : 'Agente Grok AI'}
                    >
                        <Zap className="w-3 h-3" />
                        <span className="hidden sm:inline">Grok</span>
                    </button>
                    <button
                        onClick={() => switchMode('local')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${parserMode === 'local'
                            ? 'bg-[#1a73e8]/20 text-[#4facfe] shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Bot className="w-3 h-3" />
                        <span className="hidden sm:inline">Local</span>
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Online</span>
                </div>

                {/* Clear memory */}
                <button
                    onClick={handleClearMemory}
                    title="Limpar conversa e memória"
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5 space-y-3 sm:space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        {msg.role === 'assistant' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border ${parserMode === 'grok'
                                ? 'bg-purple-500/20 border-purple-500/20'
                                : 'bg-gradient-to-br from-[#1a73e8]/30 to-[#4facfe]/20 border-[#1a73e8]/20'
                                }`}>
                                {parserMode === 'grok'
                                    ? <Zap className="w-4 h-4 text-purple-400" />
                                    : <Bot className="w-4 h-4 text-[#4facfe]" />
                                }
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

                            {/* Confirmation Card */}
                            {msg.confirmationData && (
                                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                                    <div className="bg-gradient-to-r from-[#1a73e8]/10 to-transparent px-4 py-3 border-b border-white/5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-[#4facfe]" />
                                                Confirme os dados
                                            </p>
                                            <ConfidenceBadge confidence={msg.confirmationData.confidence} />
                                        </div>
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
                                        {msg.confirmationData.description && (
                                            <div className="flex items-start gap-3">
                                                <FileText className="w-4 h-4 text-[#4facfe] mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Descrição</p>
                                                    <p className="text-sm text-gray-300">{msg.confirmationData.description}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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

                {/* Grok typing indicator */}
                {chatState === 'processing' && isProcessingWithGrok && (
                    <div className="flex gap-3 justify-start animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                        </div>
                        <div className="bg-[#1e1e1e] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            <span className="text-sm text-gray-400">Grok está pensando...</span>
                        </div>
                    </div>
                )}

                {/* Local typing indicator */}
                {chatState === 'processing' && !isProcessingWithGrok && (
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
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => { setInput(s.replace(/^[👋📅📧🗓️]\s+/, '')); inputRef.current?.focus(); }}
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
                                : parserMode === 'grok'
                                    ? 'Converse naturalmente sobre sua reunião...'
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
