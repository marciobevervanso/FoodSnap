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
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-sm text-gray-500 font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }
  
  // Se terminou de carregar e não tem usuário, manda pra home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente da Home Page (Landing)
// Se o usuário estiver logado, redireciona automaticamente para o dashboard
const HomePage = ({ onRegister, onOpenTools, user, isLoading }: { onRegister: (plan: string) => void, onOpenTools: () => void, user: User | null, isLoading: boolean }) => {
    if (!isLoading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="flex flex-col min-h-screen">
        <Hero onRegister={() => onRegister('starter')} />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing onRegister={onRegister} />
        <FAQ />
      </div>
    );
};

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true); // Começa true para evitar flash da home
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Função centralizada para buscar perfil
  const getProfile = async (sessionUser: any) => {
      try {
          // 1. Tenta buscar perfil existente
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();
            
          // Se não achou perfil, mas tem sessão (caso raro de login social sem trigger), tenta criar ou marcar incompleto
          if (!profile) {
              // Retry simples
              await new Promise(r => setTimeout(r, 1000));
              const retry = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
              profile = retry.data;
          }

          // Validação crítica: Precisa ter telefone
          if (!profile || !profile.phone_e164) {
             setIsProfileIncomplete(true);
             // Cria user temporário para permitir o preenchimento do modal
             return {
                id: sessionUser.id,
                name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Usuário',
                email: sessionUser.email || '',
                phone: '',
                public_id: profile?.public_id || '',
                plan: 'free',
                avatar: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
                is_admin: false
             } as User;
          }

          setIsProfileIncomplete(false);

          // 2. Busca Assinatura
          const { data: entitlement } = await supabase
            .from('user_entitlements')
            .select('*')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          let plan: 'free' | 'pro' | 'trial' = 'free';
          if (entitlement) {
            if (entitlement.entitlement_code === 'pro' && entitlement.is_active) plan = 'pro';
            else if (entitlement.entitlement_code === 'trial' && entitlement.is_active) plan = 'trial';
          }

          return {
            id: sessionUser.id,
            name: profile.full_name || 'Usuário',
            email: sessionUser.email || '',
            phone: profile.phone_e164,
            public_id: profile.public_id,
            plan: plan,
            plan_valid_until: entitlement?.valid_until,
            avatar: profile.avatar_url,
            is_admin: profile.is_admin || false 
          } as User;

      } catch (error) {
          console.error("Erro ao montar perfil:", error);
          return null;
      }
  };

  // Efeito Único de Autenticação
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
        try {
            // 1. Pega sessão atual
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const userData = await getProfile(session.user);
                if (mounted) setUser(userData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (mounted) setIsLoadingSession(false);
        }
    };

    initialize();

    // 2. Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        // Se for logout, limpa tudo
        if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsProfileIncomplete(false);
            setIsLoadingSession(false);
            navigate('/'); 
        } 
        // Se for login, carrega o perfil
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
                // Não seta loading true aqui para não piscar a tela se for refresh
                if (event === 'SIGNED_IN') setIsLoadingSession(true);
                
                const userData = await getProfile(session.user);
                if (mounted) {
                    setUser(userData);
                    setIsLoadingSession(false);
                }
            }
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
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
    // Força recarregamento após sucesso no modal
    setIsLoadingSession(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const userData = await getProfile(session.user);
        setUser(userData);
    }
    setIsLoadingSession(false);
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    setIsLoadingSession(true); // Mostra loader enquanto desloga
    await supabase.auth.signOut();
    // O listener SIGNED_OUT vai tratar o resto
  };

  // Tela de Bloqueio para Perfil Incompleto
  if (!isLoadingSession && user && isProfileIncomplete) {
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

  // Loader global inicial
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
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
            {/* Rota Home agora redireciona se tiver user */}
            <Route path="/" element={
                <HomePage 
                    onRegister={handleOpenRegister} 
                    onOpenTools={() => setIsToolsOpen(true)} 
                    user={user}
                    isLoading={isLoadingSession}
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
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
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

// Alterado para BrowserRouter para URLs limpas (sem #)
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