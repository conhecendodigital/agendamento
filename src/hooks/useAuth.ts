import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { User } from '../config/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Verificar sessão existente
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setAuthState({
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        user_metadata: session.user.user_metadata,
                    },
                    session,
                    loading: false,
                });
            } else {
                setAuthState({ user: null, session: null, loading: false });
            }
        };

        checkSession();

        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthState({
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        user_metadata: session.user.user_metadata,
                    },
                    session,
                    loading: false,
                });
            } else {
                setAuthState({ user: null, session: null, loading: false });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    }, []);

    const signUp = useCallback(async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;
        return data;
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }, []);

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signIn,
        signUp,
        signOut,
    };
};

export default useAuth;
