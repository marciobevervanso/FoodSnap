import React, { useState, useEffect } from 'react';
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
import FAQPage from './components/FAQPage'; // Import novo
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: 'free' | 'pro' | 'trial';
  public_id: string;
  avatar?: string;
  plan_valid_until?: string;
  is_admin?: boolean; 
}

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [currentView, setCurrentView] = useState<'home' | 'faq'>('home'); // Estado de navegação
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Check active session on load
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
        setIsAdminView(false);
        setIsLoadingSession(false);
        setCurrentView('home'); // Reset view on logout
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
           if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 500));
           await fetchUserProfile(session.user.id, session.user.email);
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
          console.warn("Perfil incompleto. Bloqueando acesso.");
          await supabase.auth.signOut();
          setUser(null);
          return;
      }

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

  const handleAuthSuccess = () => {
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdminView(false);
  };

  const toggleAdminView = () => {
    if (user?.is_admin) {
      setIsAdminView(!isAdminView);
    }
  };

  // Helper function for navigating
  const handleNavigate = (view: 'home' | 'faq') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Rota Admin
  if (user && isAdminView && user.is_admin) {
    return <AdminPanel user={user} onExitAdmin={toggleAdminView} onLogout={handleLogout} />;
  }

  // Rota Dashboard Usuário
  if (user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout} 
        onOpenAdmin={user.is_admin ? toggleAdminView : undefined} 
      />
    );
  }

  // Rota Pública (Landing Page ou FAQ Page)
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      <Header 
        onRegister={() => handleOpenRegister('starter')} 
        onLogin={handleOpenLogin}
        onOpenTools={() => setIsToolsOpen(true)}
        onNavigate={handleNavigate} // Passa navegação
      />
      
      <main>
        {currentView === 'home' ? (
          <>
            <Hero onRegister={() => handleOpenRegister('starter')} />
            <HowItWorks />
            <Features />
            <Testimonials />
            <Pricing onRegister={handleOpenRegister} />
            <FAQ />
          </>
        ) : (
          <FAQPage onBack={() => handleNavigate('home')} />
        )}
      </main>

      <Footer 
        onRegister={() => handleOpenRegister('starter')} 
        onNavigate={handleNavigate} // Passa navegação
      />
      
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

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;