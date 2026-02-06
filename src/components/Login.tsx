import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { LionLogo } from './LionLogo';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register';

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
}

export const Login: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [loading, setLoading] = useState(false);

    const { signIn, signUp } = useAuth();
    const { showToast } = useToast();

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.email) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mínimo 6 caracteres';
        }

        if (mode === 'register') {
            if (!formData.fullName) {
                newErrors.fullName = 'Nome é obrigatório';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Senhas não conferem';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            if (mode === 'login') {
                await signIn(formData.email, formData.password);
                showToast('success', 'Login realizado com sucesso!');
            } else {
                await signUp(formData.email, formData.password, formData.fullName);
                showToast('success', 'Conta criada! Verifique seu email para confirmar.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao processar';
            showToast('error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setErrors({});
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background with radial gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />

            {/* Radial glow behind card */}
            <div className="absolute inset-0 bg-radial-glow" />

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-1 h-1 bg-amber-500/40 rounded-full top-1/4 left-1/4 animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="absolute w-1.5 h-1.5 bg-amber-500/30 rounded-full top-1/3 right-1/3 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute w-1 h-1 bg-amber-500/50 rounded-full bottom-1/4 left-1/3 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute w-2 h-2 bg-amber-500/20 rounded-full top-1/2 right-1/4 animate-pulse" style={{ animationDelay: '1.5s' }} />
                <div className="absolute w-1 h-1 bg-amber-500/40 rounded-full bottom-1/3 right-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md animate-fadeInUp">
                {/* Card glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 rounded-3xl blur-xl opacity-50" />

                <div className="relative glass-strong rounded-3xl p-8 sm:p-10">
                    {/* Top decorative line */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <div className="inline-block mb-4 group">
                            <div className="relative">
                                <LionLogo
                                    size={72}
                                    className="text-amber-500 mx-auto animate-breathe transition-all duration-500 group-hover:drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                                />
                                {/* Glow ring on hover */}
                                <div className="absolute inset-0 rounded-full bg-amber-500/10 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gradient-gold mb-2 tracking-tight">
                            Valento Academy
                        </h1>
                        <p className="text-slate-400 text-sm tracking-widest uppercase">
                            Sistema de Agendamentos
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-8 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700/50" />
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className={`flex-1 py-3 text-sm font-medium transition-all relative ${mode === 'login'
                                ? 'text-amber-500'
                                : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Entrar
                            {mode === 'login' && (
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('register')}
                            className={`flex-1 py-3 text-sm font-medium transition-all relative ${mode === 'register'
                                ? 'text-amber-500'
                                : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Cadastrar
                            {mode === 'register' && (
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'register' && (
                            <div className="animate-fadeIn">
                                <label htmlFor="fullName" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                                    Nome completo
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange('fullName')}
                                        placeholder="Seu nome"
                                        className={`w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white transition-all ${errors.fullName ? 'border-red-500/50' : ''
                                            }`}
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.fullName}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    placeholder="seu@email.com"
                                    className={`w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white transition-all ${errors.email ? 'border-red-500/50' : ''
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                                Senha
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleInputChange('password')}
                                    placeholder="••••••••"
                                    className={`w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white transition-all ${errors.password ? 'border-red-500/50' : ''
                                        }`}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>
                            )}
                        </div>

                        {mode === 'register' && (
                            <div className="animate-fadeIn">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-500/80 mb-1.5">
                                    Confirmar senha
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange('confirmPassword')}
                                        placeholder="••••••••"
                                        className={`w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white transition-all ${errors.confirmPassword ? 'border-red-500/50' : ''
                                            }`}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 rounded-xl text-slate-900 font-bold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Entrar' : 'Criar conta'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Bottom decorative element */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-xs">
                            © {new Date().getFullYear()} Valento Academy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
