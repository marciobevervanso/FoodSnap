// App.tsx (FINAL)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import FAQPage from './components/FAQPage';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import AuthCallback from './components/AuthCallback';

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './auth/AuthProvider';

const HomePage = () => (
  <div className="flex flex-col min-h-screen">
    <Hero />
    <HowItWorks />
    <Features />
    <Testimonials />
    <Pricing />
    <FAQ />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; admin?: boolean }> = ({
  children,
  admin = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Carregando…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (admin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const internal = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <>
      {!internal && <Header />}
      {children}
      {!internal && <Footer />}
    </>
  );
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute admin>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
