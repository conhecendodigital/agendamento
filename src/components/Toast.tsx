import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    isExiting?: boolean;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    const iconClass = "w-5 h-5";

    switch (type) {
        case 'success':
            return <CheckCircle className={`${iconClass} text-emerald-400`} />;
        case 'error':
            return <AlertCircle className={`${iconClass} text-red-400`} />;
        case 'warning':
            return <AlertTriangle className={`${iconClass} text-amber-400`} />;
        case 'info':
            return <Info className={`${iconClass} text-blue-400`} />;
    }
};

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return {
                border: 'border-l-4 border-l-emerald-500',
                bg: 'bg-slate-800/90',
                progress: 'toast-progress-success',
            };
        case 'error':
            return {
                border: 'border-l-4 border-l-red-500',
                bg: 'bg-slate-800/90',
                progress: 'toast-progress-error',
            };
        case 'warning':
            return {
                border: 'border-l-4 border-l-amber-500',
                bg: 'bg-slate-800/90',
                progress: 'toast-progress-warning',
            };
        case 'info':
            return {
                border: 'border-l-4 border-l-blue-500',
                bg: 'bg-slate-800/90',
                progress: 'toast-progress-info',
            };
    }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, message }]);

        // Start exit animation before removing
        setTimeout(() => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
            );
        }, 3700);

        // Remove after exit animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
        );
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => {
                    const styles = getToastStyles(toast.type);

                    return (
                        <div
                            key={toast.id}
                            className={`
                ${styles.bg} ${styles.border}
                backdrop-blur-xl shadow-2xl shadow-black/30
                rounded-lg p-4 pr-10
                pointer-events-auto
                relative overflow-hidden
                ${toast.isExiting ? 'animate-slideOutUp' : 'animate-slideInRight'}
              `}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <ToastIcon type={toast.type} />
                                </div>
                                <p className="text-sm text-slate-200 leading-relaxed">{toast.message}</p>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => closeToast(toast.id)}
                                className="absolute top-3 right-3 p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Progress bar */}
                            {!toast.isExiting && (
                                <div className={`toast-progress ${styles.progress}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
