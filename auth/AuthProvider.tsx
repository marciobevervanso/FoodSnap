import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isProfileIncomplete: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const REFRESH_TIMEOUT_MS = 12000; // evita travar 2-3 min no Safari
const SAFETY_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(label)), ms);
    p.then((v) => {
      window.clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      window.clearTimeout(t);
      reject(e);
    });
  });
}

const buildUserFromProfile = async (
  authUser: any
): Promise<{ user: User | null; incomplete: boolean }> => {
  const userId = authUser.id as string;
  const email = (authUser.email as string) || '';

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!profile || !profile.phone_e164) {
    const nameFromMeta =
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      email.split('@')[0] ||
      'Usuário';

    const u: User = {
      id: userId,
      name: profile?.full_name || nameFromMeta,
      email: profile?.email || email,
      phone: '',
      public_id: profile?.public_id || '',
      plan: 'free',
      avatar:
        profile?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFromMeta)}&background=059669&color=fff`,
      is_admin: false,
    };

    return { user: u, incomplete: true };
  }

  const { data: entitlement } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let plan: 'free' | 'pro' | 'trial' = 'free';
  if (entitlement && (entitlement as any).is_active) {
    plan = (entitlement as any).entitlement_code as any;
  }

  const u: User = {
    id: userId,
    name: profile.full_name || 'Usuário',
    email: profile.email || email,
    phone: profile.phone_e164,
    public_id: profile.public_id,
    plan,
    plan_valid_until: (entitlement as any)?.valid_until,
    avatar:
      profile.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=059669&color=fff`,
    is_admin: profile.is_admin || false,
  };

  return { user: u, incomplete: false };
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mountedRef = useRef(true);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const clearState = () => {
    setUser(null);
    setIsProfileIncomplete(false);
  };

  const refresh = async () => {
    // evita tempestade, MAS não pode travar pra sempre
    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = (async () => {
      try {
        if (mountedRef.current) setIsLoading(true);

        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          REFRESH_TIMEOUT_MS,
          'getSession_timeout'
        );

        if (error) console.warn('getSession error:', error);

        const sessionUser = data.session?.user;
        if (!sessionUser) {
          if (!mountedRef.current) return;
          clearState();
          return;
        }

        // profile + entitlements também podem travar => timeout
        const { user: appUser, incomplete } = await withTimeout(
          buildUserFromProfile(sessionUser),
          REFRESH_TIMEOUT_MS,
          'buildUser_timeout'
        );

        if (!mountedRef.current) return;
        setUser(appUser);
        setIsProfileIncomplete(incomplete);
      } catch (err) {
        console.error('Auth refresh error:', err);
        if (!mountedRef.current) return;
        // se deu timeout/erro, não deixa o app preso tentando “reviver”
        clearState();
      } finally {
        // ✅ SEMPRE limpa inFlight, mesmo se safety timer já soltou loading
        inFlightRef.current = null;
        if (!mountedRef.current) return;
        setIsLoading(false);
      }
    })();

    return inFlightRef.current;
  };

  const signOut = async () => {
    // ✅ desloga “na hora” no estado do app (sem depender de eventos)
    if (mountedRef.current) setIsLoading(true);
    clearState();

    try {
      await withTimeout(supabase.auth.signOut(), 8000, 'signOut_timeout');
    } catch (e) {
      console.warn('signOut error/timeout:', e);
    } finally {
      // ✅ garante que não fica preso
      inFlightRef.current = null;
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const safety = window.setTimeout(() => {
      if (!mountedRef.current) return;
      // ✅ se travou, solta loading e também libera refresh futuro
      inFlightRef.current = null;
      setIsLoading(false);
    }, SAFETY_TIMEOUT_MS);

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        clearState();
        setIsLoading(false);
        inFlightRef.current = null;
        return;
      }

      // não trava a fila de eventos com await
      refresh().catch(() => {});
    });

    return () => {
      mountedRef.current = false;
      window.clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoading, isProfileIncomplete, refresh, signOut }),
    [user, isLoading, isProfileIncomplete]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
};
