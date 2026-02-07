import { useState, useEffect, useCallback, createContext, useContext } from 'react';

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

// Simulated auth for demo purposes
const MOCK_USER: User = {
  id: '1',
  email: 'demo@valento.academy',
  user_metadata: {
    full_name: 'Demo User'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const stored = localStorage.getItem('valento_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    if (email && password.length >= 6) {
      setUser(MOCK_USER);
      localStorage.setItem('valento_user', JSON.stringify(MOCK_USER));
    } else {
      throw new Error('Invalid credentials');
    }
  }, []);

  const signUp = useCallback(async (email: string, _password: string, fullName: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    const newUser: User = {
      ...MOCK_USER,
      email,
      user_metadata: { full_name: fullName }
    };
    setUser(newUser);
    localStorage.setItem('valento_user', JSON.stringify(newUser));
  }, []);

  const signOut = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('valento_user');
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
