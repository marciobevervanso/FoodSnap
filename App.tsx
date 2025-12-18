
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
  // Se ainda estiver carregando a sessão inicial, mostra o loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }
  
  // Se não tem usuário após o carregamento, manda pro login (Home)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se requer admin e não é, manda pro dashboard normal
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

  // 1. EFEITO CRÍTICO: Limpar a URL poluída pelo Supabase OAuth antes que o HashRouter quebre
  useEffect(() => {
    const hash = window.location.hash;
    // Se o Supabase devolveu tokens no fragmento da URL
    if (hash && (hash.includes('access_token=') || hash.includes('type=recovery') || hash.includes('error='))) {
      console.log("Detectado token de autenticação na URL. Limpando para o roteador...");
      // Removemos o fragmento da URL original para o HashRouter não tentar usá-lo como rota
      // O Supabase ainda consegue ler o fragmento porque ele faz isso via memória interna no onAuthStateChange
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // 2. EFEITO DE INICIALIZAÇÃO: Autenticação e Perfil
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
        console.error("Erro na inicialização da auth:", err);
        if (mounted) setIsLoadingSession(false);
      }
    };

    initAuth();

    // Listener de mudanças de estado (Login/Logout)
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
           // Redireciona para o dashboard apenas se estiver na página de login/home
           if (location.pathname === '/') {
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
      // 1. Busca o perfil básico
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 

      if (profileError) throw profileError;

      // 2. Verifica se o perfil está incompleto (falta telefone)
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
          return; // Para aqui para o modal de completação abrir
      }

      // 3. Busca o plano/assinatura do usuário
      setIsProfileIncomplete(false);
      const { data: entitlement } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let plan: 'free' | 'pro' | 'trial' = 'free';
      if (entitlement && entitlement.is_active) {
        plan = entitlement.entitlement_code as any;
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

    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      // Em caso de erro, não limpamos o usuário se ele já estiver parcialmente logado
    } finally {
      // GARANTIA: Desativa o loading em qualquer situação
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
    // Quando o modal de cadastro termina, força atualização
    if (supabase.auth.getSession()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await fetchUserProfile(session.user.id, session.user.email);
    }
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setIsLoadingSession(true);
    await supabase.auth.signOut();
  };

  const isInternalPage = location.pathname.includes('/dashboard') || location.pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col w-full">
      {/* Esconde header e footer dentro do dashboard ou admin */}
      {!isInternalPage && (
          <Header 
            onRegister={() => handleOpenRegister('starter')} 
            onLogin={handleOpenLogin}
            onOpenTools={() => setIsToolsOpen(true)}
            isLoggedIn={!!user}
          />
      )}
      
      <main className="flex-grow flex flex-col w-full">
        {/* Loader Global para quando a sessão está sendo validada */}
        {isLoadingSession ? (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
          </div>
        ) : (
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
        )}
      </main>

      {!isInternalPage && (
          <Footer onRegister={() => handleOpenRegister('starter')} />
      )}
      
      {/* Modal de Registro ou Login */}
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
