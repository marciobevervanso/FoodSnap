
import React, { useState, useEffect, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import RegistrationModal from './components/RegistrationModal';
import CalculatorsModal from './components/CalculatorsModal';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel'; 
import FAQPage from './components/FAQPage';
import Home from './pages/Home';
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import { User } from './types';

// Componente Wrapper para proteger rotas privadas
interface ProtectedRouteProps {
  user: User | null;
  isLoading: boolean;
  requiredAdmin?: boolean;
}

const ProtectedRoute: React.FC<PropsWithChildren<ProtectedRouteProps>> = ({ children, user, isLoading, requiredAdmin = false }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

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

  // Correção para OAuth + HashRouter: Detecta e limpa tokens da URL antes que o Router se perca
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('error='))) {
      // É um retorno de OAuth do Supabase. 
      // O Supabase irá processar isso automaticamente via onAuthStateChange.
      // Nós apenas limpamos o hash para o HashRouter não tentar navegar para uma rota inexistente.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
           await fetchUserProfile(session.user.id, session.user.email);
        } else if (mounted) {
           setIsLoadingSession(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setIsLoadingSession(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsProfileIncomplete(false);
        setIsLoadingSession(false);
        navigate('/'); 
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
           await fetchUserProfile(session.user.id, session.user.email);
           // Se estiver na home e logar, manda pro dashboard
           if (window.location.hash === '#/' || window.location.hash === '') {
               navigate('/dashboard');
           }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
            avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(email || 'User')}&background=10b981&color=fff`,
            is_admin: false
          });
      } else {
          setIsProfileIncomplete(false);

          const { data: entitlement } = await supabase
            .from('user_entitlements')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          let plan: 'free' | 'pro' | 'trial' = 'free';
          if (entitlement) {
            if (entitlement.entitlement_code === 'pro' && entitlement.is_active) plan = 'pro';
            else if (entitlement.entitlement_code === 'trial' && entitlement.is_active) plan = 'trial';
          }

          setUser({
            id: userId,
            name: profile.full_name || 'Usuário',
            email: profile.email || email || '',
            phone: profile.phone_e164,
            public_id: profile.public_id,
            plan: plan,
            plan_valid_until: entitlement?.valid_until,
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=10b981&color=fff`,
            is_admin: profile.is_admin || false 
          });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Se houver erro, garantimos que o user não fique nulo se já existir sessão
      if (!user) setUser(null);
    } finally {
      // CRÍTICO: Sempre desativar o loading
      setIsLoadingSession(false);
    }
  };

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
    if (user?.id) {
        await fetchUserProfile(user.id, user.email);
    }
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  const isInternalPage = location.pathname.includes('/dashboard') || location.pathname.includes('/admin');

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
            <Route path="/" element={
              <Home 
                onRegister={handleOpenRegister} 
                onLogin={handleOpenLogin}
                onOpenTools={() => setIsToolsOpen(true)} 
              />
            } />
            <Route path="/faq" element={<FAQPage onBack={() => navigate('/')} />} />
            <Route path="/dashboard" element={
                <ProtectedRoute user={user} isLoading={isLoadingSession}>
                    <Dashboard 
                        user={user!} 
                        onLogout={handleLogout} 
                        onOpenAdmin={user?.is_admin ? () => navigate('/admin') : undefined} 
                    />
                </ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute user={user} isLoading={isLoadingSession} requiredAdmin={true}>
                    <AdminPanel 
                        user={user!} 
                        onExitAdmin={() => navigate('/dashboard')} 
                        onLogout={handleLogout} 
                    />
                </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isInternalPage && (
          <Footer onRegister={() => handleOpenRegister('starter')} />
      )}
      
      <RegistrationModal 
        isOpen={isModalOpen || (!!user && isProfileIncomplete)} 
        onClose={() => !isProfileIncomplete && setIsModalOpen(false)} 
        plan={selectedPlan}
        mode={isProfileIncomplete ? 'register' : authMode}
        isCompletingProfile={isProfileIncomplete}
        onSuccess={handleAuthSuccess}
      />
      
      <CalculatorsModal 
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </HashRouter>
  );
};

export default App;
