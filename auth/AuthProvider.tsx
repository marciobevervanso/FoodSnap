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

const buildUserFromProfile = async (authUser: any): Promise<{ user: User | null; incomplete: boolean }> => {
  const userId = authUser.id as string;
  const email = (authUser.email as string) || '';

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  // Se não tem profile/phone => força completar cadastro (modal)
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

  // Entitlements (plano)
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

  const refresh = async () => {
    // evita “tempestade” de refresh em eventos/token refresh + re-render
    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = (async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn('getSession error:', error);

        const sessionUser = data.session?.user;
        if (!sessionUser) {
          if (!mountedRef.current) return;
          setUser(null);
          setIsProfileIncomplete(false);
          return;
        }

        const { user: appUser, incomplete } = await buildUserFromProfile(sessionUser);
        if (!mountedRef.current) return;
        setUser(appUser);
        setIsProfileIncomplete(incomplete);
      } catch (err) {
        console.error('Auth refresh error:', err);
        if (!mountedRef.current) return;
        setUser(null);
        setIsProfileIncomplete(false);
      } finally {
        if (!mountedRef.current) return;
        setIsLoading(false);
        inFlightRef.current = null;
      }
    })();

    return inFlightRef.current;
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // onAuthStateChange vai limpar o resto, mas garantimos aqui também
    setUser(null);
    setIsProfileIncomplete(false);
    setIsLoading(false);
  };

  useEffect(() => {
    mountedRef.current = true;

    // Airbag: nunca ficar preso em loading
    const safety = window.setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 8000);

    // init
    refresh();

    // listener
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      // regra: auth events só atualizam estado. NÃO navegam.
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsProfileIncomplete(false);
        setIsLoading(false);
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION
      await refresh();
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
