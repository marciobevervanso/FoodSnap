import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const cleanTrailingHash = () => {
  // remove "…?#" ou "…#"
  if (window.location.hash === '#' || window.location.href.endsWith('#')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const [msg, setMsg] = useState('Finalizando login...');

  useEffect(() => {
    let alive = true;

    (async () => {
      cleanTrailingHash();

      // espera o Supabase processar o code -> session (PKCE)
      // (detectSessionInUrl: true já faz boa parte, mas aqui garantimos)
      for (let i = 0; i < 20; i++) {
        if (!alive) return;
        await refresh();
        if (user) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!alive) return;

      setMsg('Redirecionando...');
      navigate('/dashboard', { replace: true });
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <div className="text-sm text-gray-600">{msg}</div>
      </div>
    </div>
  );
};

export default AuthCallback;
