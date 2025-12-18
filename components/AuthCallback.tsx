import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const cleanUrl = () => {
      // remove query/hash do callback pra não reprocessar em refresh
      window.history.replaceState({}, document.title, '/auth/callback');
    };

    const finish = async () => {
      try {
        // 1) Se vier ?code=... (PKCE), troca por sessão de forma explícita
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('exchangeCodeForSession error:', error);
            cleanUrl();
            if (!cancelled) navigate('/', { replace: true });
            return;
          }

          cleanUrl();
          if (!cancelled) navigate('/dashboard', { replace: true });
          return;
        }

        // 2) Se não tiver code, tenta pegar sessão normal
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error);
          cleanUrl();
          if (!cancelled) navigate('/', { replace: true });
          return;
        }

        cleanUrl();
        if (!cancelled) {
          navigate(data.session?.user ? '/dashboard' : '/', { replace: true });
        }
      } catch (e) {
        console.error('AuthCallback fatal:', e);
        cleanUrl();
        if (!cancelled) navigate('/', { replace: true });
      }
    };

    finish();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
      <p className="text-gray-600 text-sm">Finalizando login...</p>
    </div>
  );
}
