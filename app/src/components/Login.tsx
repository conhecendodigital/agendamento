import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
    const [formData, setFormData] = useState<FormData>({ email: '', password: '', confirmPassword: '', fullName: '' });
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { signIn, signUp } = useAuth();
    const { showToast } = useToast();

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        if (!formData.email) newErrors.email = 'Email obrigatório';
        if (!formData.password || formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (mode === 'register') {
            if (!formData.fullName) newErrors.fullName = 'Nome obrigatório';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não conferem';
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
                showToast('success', 'Login realizado!');
            } else {
                await signUp(formData.email, formData.password, formData.fullName);
                showToast('success', 'Conta criada!');
            }
        } catch { showToast('error', 'Erro na autenticação.'); }
        finally { setLoading(false); }
    };

    const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    // Netflix Style Input Field
    const InputField = ({ icon: Icon, label, ...props }: any) => (
        <div className="space-y-2 w-full">
            {label && <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">{label}</label>}
            <div className="relative w-full group">
                {/* Icon */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#0071eb] transition-colors pointer-events-none z-10">
                    <Icon className="w-5 h-5" />
                </div>

                {/* Input - Netflix Style */}
                <input
                    {...props}
                    className={`
                        w-full bg-[#333] border-0 rounded text-white py-4 pl-12 pr-10
n                        placeholder-gray-500 outline-none transition-all duration-200
                        focus:ring-2 focus:ring-[#0071eb] focus:bg-[#454545]
                        ${props.error ? 'ring-2 ring-[#e50914]' : ''}
                    `}
                />

                {/* Password Toggle */}
                {props.toggle && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                        {props.toggle}
                    </div>
                )}
            </div>
            {props.error && <span className="text-xs text-[#e50914] ml-1">{props.error}</span>}
        </div>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black relative overflow-hidden">
            {/* Netflix-style Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black pointer-events-none" />
            
            {/* Subtle Blue Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0071eb]/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Login Card - Netflix Style */}
            <div className="relative w-full max-w-md z-10 animate-fadeInUp">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8 sm:p-12 shadow-2xl">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex justify-center items-center p-4 mb-4 rounded-full bg-[#0071eb]/10">
                            <LionLogo size={56} className="text-[#0071eb]" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Valento <span className="text-[#0071eb]">Academy</span></h1>
                        <p className="text-gray-400 text-sm mt-2">Sistema de Agendamento</p>
                    </div>

                    {/* Tabs - Netflix Style */}
                    <div className="flex bg-[#141414] p-1 rounded-lg mb-8">
                        <button 
                            onClick={() => setMode('login')} 
                            className={`flex-1 py-3 text-sm font-semibold rounded transition-all ${
                                mode === 'login' 
                                    ? 'bg-[#0071eb] text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Entrar
                        </button>
                        <button 
                            onClick={() => setMode('register')} 
                            className={`flex-1 py-3 text-sm font-semibold rounded transition-all ${
                                mode === 'register' 
                                    ? 'bg-[#0071eb] text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Criar Conta
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'register' && (
                            <InputField 
                                label="Nome Completo" 
                                icon={User} 
                                placeholder="Seu nome" 
                                value={formData.fullName} 
                                onChange={handleInputChange('fullName')} 
                                error={errors.fullName} 
                            />
                        )}

                        <InputField 
                            label="Email" 
                            icon={Mail} 
                            placeholder="seu@email.com" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange('email')} 
                            error={errors.email} 
                        />

                        <InputField
                            label="Senha" 
                            icon={Lock} 
                            placeholder="••••••••" 
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password} 
                            onChange={handleInputChange('password')} 
                            error={errors.password}
                            toggle={
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="p-1 text-gray-500 hover:text-[#0071eb] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        {mode === 'register' && (
                            <InputField
                                label="Confirmar Senha" 
                                icon={Lock} 
                                placeholder="••••••••" 
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword} 
                                onChange={handleInputChange('confirmPassword')} 
                                error={errors.confirmPassword}
                                toggle={
                                    <button 
                                        type="button" 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                        className="p-1 text-gray-500 hover:text-[#0071eb] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        )}

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-[#0071eb] hover:bg-[#0056b3] text-white font-bold py-4 rounded transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-6 hover:scale-[1.02]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'login' ? 'Entrar' : 'Criar Conta'} <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    {/* Netflix-style Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-xs">
                            Ao continuar, você concorda com nossos Termos de Uso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
