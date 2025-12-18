// App.tsx
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Location,
} from 'react-router-dom';

import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';
import CalculatorsModal from './components/CalculatorsModal';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import FAQPage from './components/FAQPage';
import AuthCallback from './components/AuthCallback';

import { LanguageProvider } from './contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import type { User } from './types';

type NavState = {
  openLogin?: boolean;
  next?: string;
};

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
  </div>
);

const HomePage = ({
  onRegister,
  onOpenTools,
}: {
  onRegister: (plan: string) => void;
  onOpenTools: () => void;
}) => (
  <div className="flex flex-col min-h-screen">
    <Hero onRegister={() => onRegister('starter')} />
    <HowItWorks />
    <Features />
    <Testimonials />
    <Pricing onRegister={onRegister} />
    <FAQ />
  </div>
);

/**
 * ✅ Gate central: se tentar acessar rota privada sem sessão,
 * manda pra "/" com state { openLogin: true, next: <rota desejada> }.
 */
const ProtectedRoute: React.FC<
  PropsWithChildren<{
    user: User | null;
    isLoading: boolean;
    requiredAdmin?: boolean;
  }>
> = ({ children, user, isLoading, requiredAdmin = false }) => {
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ openLogin: true, next: location.pathname } satisfies NavState}
      />
    );
  }

  if (requiredAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const { user, isLoading, isProfileIncomplete, signOut } = useAuth();

  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: NavState };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');

  // guarda pra onde o usuário queria ir (ex: /dashboard)
  const nextPath = useMemo(() => {
    const st = (location.state || {}) as NavState;
    return st.next || '/dashboard';
  }, [location.state]);

  /**
   * ✅ Se ProtectedRoute mandou pra "/" com openLogin=true,
   * abre o modal em modo LOGIN automaticamente.
   */
  useEffect(() => {
    const st = (location.state || {}) as NavState;
    if (st.openLogin) {
      setAuthMode('login');
      setIsModalOpen(true);

      // limpa o state pra não reabrir em loops
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const handleOpenRegister = (plan: string = 'starter') => {
    setSelectedPlan(plan);
    setAuthMode('register');
    setIsModalOpen(true);
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsModalOpen(true);
  };

  /**
   * ✅ Após login/registro completo:
   * - fecha modal
   * - manda pro "nextPath" (por padrão /dashboard)
   */
  const handleAuthSuccess = async () => {
    setIsModalOpen(false);

    // se perfil incompleto, o modal continua aberto por regra do próprio isOpen abaixo
    // então só navega quando não estiver incompleto
    if (!isProfileIncomplete) {
      navigate(nextPath || '/dashboard', { replace: true });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const isInternalPage =
    location.pathname.includes('/dashboard') || location.pathname.includes('/admin');

  // ✅ Loader global só enquanto auth está carregando (evita “loading infinito” espalhado)
  if (isLoading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col w-full">
      {!isInternalPage && (
        <Header
          onRegister={() => handleOpenRegister('starter')}
          onLogin={handleOpenLogin}
          onOpenTools={() => setIsToolsOpen(true)}
          isLoggedIn={!!user}
        />
      )}

      <main className="flex-grow flex flex-col w-full">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage onRegister={handleOpenRegister} onOpenTools={() => setIsToolsOpen(true)} />
            }
          />

          <Route path="/faq" element={<FAQPage onBack={() => navigate('/')} />} />

          {/* OAuth / Magic link callback */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} isLoading={isLoading}>
                <Dashboard
                  user={user!}
                  onLogout={handleLogout}
                  onOpenAdmin={user?.is_admin ? () => navigate('/admin') : undefined}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} isLoading={isLoading} requiredAdmin>
                <AdminPanel
                  user={user!}
                  onExitAdmin={() => navigate('/dashboard')}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isInternalPage && <Footer onRegister={() => handleOpenRegister('starter')} />}

      <RegistrationModal
        isOpen={isModalOpen || (!!user && isProfileIncomplete)}
        onClose={() => !isProfileIncomplete && setIsModalOpen(false)}
        plan={selectedPlan}
        mode={isProfileIncomplete ? 'register' : authMode}
        isCompletingProfile={isProfileIncomplete}
        onSuccess={handleAuthSuccess}
      />

      <CalculatorsModal isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
