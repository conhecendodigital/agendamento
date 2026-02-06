import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, signUp } = useAuth();
    const { showToast } = useToast();

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email é obrigatório';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        // Validar senha
        if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
        }

        // Validações de registro
        if (mode === 'register') {
            if (!formData.fullName.trim()) {
                newErrors.fullName = 'Nome é obrigatório';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'As senhas não coincidem';
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
                showToast('success', 'Conta criada! Verifique seu email para confirmar o cadastro.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';

            // Traduzir mensagens comuns do Supabase
            let translatedMessage = message;
            if (message.includes('Invalid login credentials')) {
                translatedMessage = 'Email ou senha incorretos';
            } else if (message.includes('User already registered')) {
                translatedMessage = 'Este email já está cadastrado';
            } else if (message.includes('Email not confirmed')) {
                translatedMessage = 'Confirme seu email antes de fazer login';
            }

            showToast('error', translatedMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        // Limpar erro do campo ao digitar
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const toggleMode = () => {
        setMode((prev) => (prev === 'login' ? 'register' : 'login'));
        setErrors({});
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl animate-scaleIn">
                    {/* Logo e título */}
                    <div className="flex flex-col items-center mb-8">
                        <LionLogo size={80} className="text-amber-500 mb-4" />
                        <h1 className="text-2xl font-bold text-amber-500 tracking-tight">
                            Valento Academy
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Gerencie seus agendamentos
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-6 bg-slate-800/50 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'login'
                                    ? 'bg-amber-500 text-slate-900'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'register'
                                    ? 'bg-amber-500 text-slate-900'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nome (apenas no registro) */}
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Nome completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange('fullName')}
                                        placeholder="Seu nome"
                                        className={`w-full bg-slate-800/50 border rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 transition-all ${errors.fullName ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'
                                            }`}
                                    />
                                </div>
                                {errors.fullName && (
                                    <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
                                )}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    placeholder="seu@email.com"
                                    className={`w-full bg-slate-800/50 border rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 transition-all ${errors.email ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Senha */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formData.password}
                                    onChange={handleInputChange('password')}
                                    placeholder="••••••••"
                                    className={`w-full bg-slate-800/50 border rounded-lg py-3 pl-11 pr-11 text-white placeholder-slate-500 transition-all ${errors.password ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirmar senha (apenas no registro) */}
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Confirmar senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange('confirmPassword')}
                                        placeholder="••••••••"
                                        className={`w-full bg-slate-800/50 border rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'
                                            }`}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}

                        {/* Botão de submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 rounded-lg text-slate-900 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                                </>
                            ) : (
                                mode === 'login' ? 'Entrar' : 'Criar conta'
                            )}
                        </button>
                    </form>

                    {/* Link alternativo */}
                    <p className="text-center text-slate-400 text-sm mt-6">
                        {mode === 'login' ? (
                            <>
                                Não tem uma conta?{' '}
                                <button onClick={toggleMode} className="text-amber-500 hover:underline font-medium">
                                    Cadastre-se
                                </button>
                            </>
                        ) : (
                            <>
                                Já tem uma conta?{' '}
                                <button onClick={toggleMode} className="text-amber-500 hover:underline font-medium">
                                    Entrar
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
