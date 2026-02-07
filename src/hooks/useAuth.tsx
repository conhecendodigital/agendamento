import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert Supabase user to our User interface
const convertUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  user_metadata: {
    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0]
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(convertUser(session.user));
        }
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? convertUser(session.user) : null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem('valento_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) setUser(convertUser(data.user));
    } else {
      // Fallback to localStorage mock
      await new Promise(resolve => setTimeout(resolve, 800));
      if (email && password.length >= 6) {
        const registeredUsers = JSON.parse(localStorage.getItem('valento_registered_users') || '{}');
        const registeredData = registeredUsers[email.toLowerCase()];
        const loggedInUser: User = {
          id: registeredData?.id || crypto.randomUUID(),
          email,
          user_metadata: { full_name: registeredData?.full_name || email.split('@')[0] }
        };
        setUser(loggedInUser);
        localStorage.setItem('valento_user', JSON.stringify(loggedInUser));
      } else {
        throw new Error('Invalid credentials');
      }
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;
      if (data.user) setUser(convertUser(data.user));
    } else {
      // Fallback to localStorage mock
      await new Promise(resolve => setTimeout(resolve, 800));
      const userId = crypto.randomUUID();
      const newUser: User = {
        id: userId,
        email,
        user_metadata: { full_name: fullName }
      };
      const registeredUsers = JSON.parse(localStorage.getItem('valento_registered_users') || '{}');
      registeredUsers[email.toLowerCase()] = { id: userId, full_name: fullName };
      localStorage.setItem('valento_registered_users', JSON.stringify(registeredUsers));
      setUser(newUser);
      localStorage.setItem('valento_user', JSON.stringify(newUser));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      localStorage.removeItem('valento_user');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
