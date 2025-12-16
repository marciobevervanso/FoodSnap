import React, { useState, useEffect, PropsWithChildren } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { Loader2, LogOut } from 'lucide-react';
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

// Componente da Home Page (Landing)
const HomePage = ({ onRegister, onOpenTools }: { onRegister: (plan: string) => void, onOpenTools: () => void }) => (
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
           if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 500));
           await fetchUserProfile(session.user.id, session.user.email);
           if (location.pathname === '/' || location.pathname === '') {
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
      let profile = null;
      
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); 

        if (error) throw error;

        if (data) {
          profile = data;
          break;
        }
        
        if (i < 2) await new Promise(r => setTimeout(r, 500));
      }

      if (!profile || !profile.phone_e164) {
          console.warn("Perfil incompleto. Solicitando complemento.");
          setIsProfileIncomplete(true);
          
          setUser({
            id: userId,
            name: profile?.full_name || email?.split('@')[0] || 'Usuário',
            email: profile?.email || email || '',
            phone: '',
            public_id: profile?.public_id || '',
            plan: 'free',
            avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(email || 'User')}&background=059669&color=fff`,
            is_admin: false
          });
          setIsLoadingSession(false);
          return;
      }

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
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=059669&color=fff`,
        is_admin: profile.is_admin || false 
      });

    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    } finally {
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
    if (user?.id && user?.email) {
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (user && isProfileIncomplete) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-gray-50 to-gray-50 -z-10" />
             <RegistrationModal 
                isOpen={true} 
                onClose={() => {}} 
                plan={selectedPlan}
                mode="register"
                isCompletingProfile={true}
                onSuccess={handleAuthSuccess}
             />
             <div className="absolute bottom-8 left-0 right-0 text-center">
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <LogOut size={16} /> Cancelar e Sair
                </button>
             </div>
        </div>
      );
  }

  const isInternalPage = location.pathname.includes('/dashboard') || location.pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900 flex flex-col">
      
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
            <Route path="/" element={<HomePage onRegister={handleOpenRegister} onOpenTools={() => setIsToolsOpen(true)} />} />
            
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
            
            {/* Catch-all garantido */}
            <Route path="*" element={<HomePage onRegister={handleOpenRegister} onOpenTools={() => setIsToolsOpen(true)} />} />
        </Routes>
      </main>

      {!isInternalPage && (
          <Footer onRegister={() => handleOpenRegister('starter')} />
      )}
      
      <RegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        plan={selectedPlan}
        mode={authMode}
        onSuccess={handleAuthSuccess}
      />
      
      <CalculatorsModal 
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
      />
    </div>
  );
};

// Usando HashRouter para máxima compatibilidade
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