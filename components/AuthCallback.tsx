import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    
    // ✅ Timeout de segurança caso algo dê errado
    const timeout = setTimeout(() => {
      if (alive) {
        console.warn('Auth callback timeout - redirecting to home');
        navigate('/', { replace: true });
      }
    }, 10000); // 10 segundos

    const finishAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/', { replace: true });
          return;
        }
        
        if (data.session?.user) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Fatal auth callback error:', err);
        navigate('/', { replace: true });
      }
    };

    finishAuth();

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
    </div>
  );
};

export default AuthCallback;
