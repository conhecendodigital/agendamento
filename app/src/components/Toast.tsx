import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, X, AlertTriangle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    // Icons per type - Netflix Style
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-[#46d369]" />,
        error: <XCircle className="w-5 h-5 text-[#e50914]" />,
        warning: <AlertTriangle className="w-5 h-5 text-[#f5c518]" />,
        info: <Info className="w-5 h-5 text-[#0071eb]" />,
    };

    // Border/Background styles per type - Netflix Dark Theme
    const styles = {
        success: 'border-[#46d369]/30 bg-[#46d369]/10',
        error: 'border-[#e50914]/30 bg-[#e50914]/10',
        warning: 'border-[#f5c518]/30 bg-[#f5c518]/10',
        info: 'border-[#0071eb]/30 bg-[#0071eb]/10',
    };

    return (
        <div className={`flex items-center gap-3 bg-[#141414] border ${styles[toast.type]} rounded-lg px-4 py-3 shadow-2xl shadow-black/80 animate-slideIn`}>
            {icons[toast.type]}
            <p className="text-white text-sm flex-1 font-medium">{toast.message}</p>
            <button 
                onClick={() => onRemove(toast.id)} 
                className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 max-w-full sm:max-w-sm">
                {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />)}
            </div>
        </ToastContext.Provider>
    );
};
