import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const finishAuth = async () => {
      try {
        // 🔑 ISSO É O MAIS IMPORTANTE
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/', { replace: true });
          return;
        }

        if (data.session?.user) {
          // ✅ sessão OK → dashboard
          navigate('/dashboard', { replace: true });
          return;
        }

        // fallback de segurança
        setTimeout(async () => {
          const retry = await supabase.auth.getSession();
          if (retry.data.session?.user && alive) {
            navigate('/dashboard', { replace: true });
          } else if (alive) {
            navigate('/', { replace: true });
          }
        }, 800);
      } catch (err) {
        console.error('Fatal auth callback error:', err);
        navigate('/', { replace: true });
      }
    };

    finishAuth();

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
    </div>
  );
};

export default AuthCallback;
