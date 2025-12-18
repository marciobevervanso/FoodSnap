import React, { useState, useEffect, PropsWithChildren } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import { User } from './types';

interface ProtectedRouteProps {
  user: User | null;
  isLoading: boolean;
  requiredAdmin?: boolean;
}

const ProtectedRoute: React.FC<PropsWithChildren<ProtectedRouteProps>> = ({
  children,
  user,
  isLoading,
  requiredAdmin = false,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (requiredAdmin && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

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

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!profile || !profile.phone_e164) {
        setIsProfileIncomplete(true);
        setUser({
          id: userId,
          name: profile?.full_name || email?.split('@')[0] || 'Usuário',
          email: profile?.email || email || '',
          phone: '',
          public_id: profile?.public_id || '',
          plan: 'free',
          avatar:
            profile?.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(email || 'User')}&background=059669&color=fff`,
          is_admin: false,
        });
        return;
      }

      setIsProfileIncomplete(false);

      const { data: entitlement } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let plan: 'free' | 'pro' | 'trial' = 'free';
      if (entitlement && (entitlement as any).is_active) {
        plan = (entitlement as any).entitlement_code as any;
      }

      setUser({
        id: userId,
        name: profile.full_name || 'Usuário',
        email: profile.email || email || '',
        phone: profile.phone_e164,
        public_id: profile.public_id,
        plan: plan,
        plan_valid_until: (entitlement as any)?.valid_until,
        avatar:
          profile.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=059669&color=fff`,
        is_admin: profile.is_admin || false,
      });
    } catch (error) {
      // ⚠️ Se perfil falhar por RLS/timeout, NÃO podemos travar o app pra sempre
      console.error('Error fetching user profile:', error);

      setUser({
        id: userId,
        name: email?.split('@')[0] || 'Usuário',
        email: email || '',
        phone: '',
        public_id: '',
        plan: 'free',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email || 'User')}&background=059669&color=fff`,
        is_admin: false,
      });

      // Se não conseguiu ler o profile, força completar depois
      setIsProfileIncomplete(true);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // ✅ Airbag: nunca fica loading eterno (rede lenta, auth travou, etc.)
    const safety = window.setTimeout(() => {
      if (mounted) setIsLoadingSession(false);
    }, 6000);

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('getSession error:', error);

        if (!mounted) return;

        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id, data.session.user.email || undefined);
        } else {
          setIsLoadingSession(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setIsLoadingSession(false);
      }
    };

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        // ✅ Trata também o boot oficial do Supabase
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email || undefined);
          } else {
            setIsLoadingSession(false);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsProfileIncomplete(false);
          setIsLoadingSession(false);
          navigate('/', { replace: true });
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email || undefined);

            const path = window.location.pathname || '/';
            if (path === '/' || path === '') navigate('/dashboard', { replace: true });
          } else {
            setIsLoadingSession(false);
          }
        }
      } catch (err) {
        console.error('onAuthStateChange error:', err);
        setIsLoadingSession(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenRegister = (plan: string = 'starter') => {
    setSelectedPlan(plan);
    setAuthMode('register');
    setIsModalOpen(true);
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsModalOpen(true);
  };

  const handleAuthSuccess = async () => {
    // Depois do login, o onAuthStateChange já vai puxar profile
    setIsModalOpen(false);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    setIsLoadingSession(true);
    await supabase.auth.signOut();
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  const isInternalPage =
    location.pathname.includes('/dashboard') || location.pathname.includes('/admin');

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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} isLoading={isLoadingSession}>
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
              <ProtectedRoute user={user} isLoading={isLoadingSession} requiredAdmin>
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
        <AppContent />
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
