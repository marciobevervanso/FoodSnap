import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = window.location.href;

        // Se tiver ?code=..., troca por session (PKCE)
        if (window.location.search.includes("code=")) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) console.warn("exchangeCodeForSession:", error);
        }

        // ✅ LIMPA TUDO: remove ?code=... e também o "#"
        window.history.replaceState({}, "", "/auth/callback");

        // Agora pega sessão e vai pro dashboard
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          if (alive) navigate("/dashboard", { replace: true });
        } else {
          if (alive) navigate("/", { replace: true });
        }
      } catch (e) {
        console.error("AuthCallback error:", e);
        if (alive) navigate("/", { replace: true });
      }
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
