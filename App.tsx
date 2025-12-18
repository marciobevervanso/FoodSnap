import React, { useState } from 'react';
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
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';

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

const AppRoutes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [selectedPlan, setSelectedPlan] = useState('starter');

  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoading, isProfileIncomplete, refresh, signOut } = useAuth();

  const handleOpenRegister = (plan: string = 'starter') => {
    setSelectedPlan(plan);
    setAuthMode('register');
    setIsModalOpen(true);
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsModalOpen(true);
  };

  // depois de login/senha ou completar perfil: só garante refresh e manda pro dashboard
  const handleAuthSuccess = async () => {
    setIsModalOpen(false);
    await refresh();
    navigate('/dashboard', { replace: true });
  };

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
              <HomePage
                onRegister={handleOpenRegister}
                onOpenTools={() => setIsToolsOpen(true)}
              />
            }
          />

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/faq" element={<FAQPage onBack={() => navigate('/')} />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} isLoading={isLoading}>
                <Dashboard
                  user={user!}
                  onLogout={signOut}
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
                  onLogout={signOut}
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
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
