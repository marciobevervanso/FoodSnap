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
import FAQPage from './components/FAQPage';
import { LanguageProvider } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';
import { Loader2, LogOut } from 'lucide-react';
import { User } from './types'; // Importação corrigida

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [currentView, setCurrentView] = useState<'home' | 'faq'>('home'); 
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

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
        setIsProfileIncomplete(false);
        setIsLoadingSession(false);
        setCurrentView('home');
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdminView(false);
    setIsProfileIncomplete(false);
  };

  const toggleAdminView = () => {
    if (user?.is_admin) {
      setIsAdminView(!isAdminView);
    }
  };

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

  if (user && isAdminView && user.is_admin) {
    return <AdminPanel user={user} onExitAdmin={toggleAdminView} onLogout={handleLogout} />;
  }

  if (user && !isProfileIncomplete) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout} 
        onOpenAdmin={user.is_admin ? toggleAdminView : undefined} 
      />
    );
  }

  if (user && isProfileIncomplete) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-gray-50 to-gray-50 -z-10" />
             <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl"></div>
             <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>

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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      <Header 
        onRegister={() => handleOpenRegister('starter')} 
        onLogin={handleOpenLogin}
        onOpenTools={() => setIsToolsOpen(true)}
        onNavigate={handleNavigate}
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
        onNavigate={handleNavigate} 
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
