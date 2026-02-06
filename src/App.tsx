import { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { LionLogo } from './components/LionLogo';

function AppContent() {
  const { user, loading } = useAuth();

  // Tela de loading inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <LionLogo size={64} className="text-amber-500" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderização condicional baseada no estado de autenticação
  return user ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
