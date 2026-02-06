import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastConfig = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-emerald-500/20 border-emerald-500/50',
        iconClass: 'text-emerald-500',
    },
    error: {
        icon: AlertCircle,
        bgClass: 'bg-red-500/20 border-red-500/50',
        iconClass: 'text-red-500',
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-500/20 border-amber-500/50',
        iconClass: 'text-amber-500',
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-500/20 border-blue-500/50',
        iconClass: 'text-blue-500',
    },
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md animate-slideIn ${config.bgClass}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconClass}`} />
            <p className="text-sm text-white flex-1">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={closeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
