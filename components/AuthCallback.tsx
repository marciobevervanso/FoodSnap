import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    (async () => {
      // Espera o Supabase trocar o "code" por session (PKCE)
      for (let i = 0; i < 40; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          if (alive) navigate("/dashboard", { replace: true });
          return;
        }
        await sleep(150);
      }

      if (alive) navigate("/", { replace: true });
    })();

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
