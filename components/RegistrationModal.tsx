import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2, Lock, Mail, User as UserIcon, Eye, EyeOff, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  mode: 'login' | 'register';
  isCompletingProfile?: boolean;
  onSuccess: () => void;
}

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  isOpen, 
  onClose, 
  plan, 
  mode, 
  isCompletingProfile = false,
  onSuccess 
}) => {
  const { t } = useLanguage();
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(mode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (isCompletingProfile) {
        // Se estiver completando perfil, busca dados da sessão atual
        supabase.auth.getUser().then(({ data }) => {
           if (data.user) {
             setFormData(prev => ({
               ...prev,
               email: data.user?.email || '',
               name: data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || '',
             }));
           }
        });
      } else {
        setActiveMode(mode);
      }
      
      setLoading(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowPassword(false);
      // Não reseta o form se for completar perfil, para não perder o que já foi carregado
      if (!isCompletingProfile) setFormData({ name: '', email: '', phone: '', password: '' });
    }
  }, [isOpen, mode, isCompletingProfile]);

  const friendlyAuthError = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('database error')) return 'Server Error.';
    if (m.includes('already registered') || m.includes('user already registered')) return 'Email already registered.';
    if (m.includes('invalid login credentials')) return 'Invalid credentials.';
    if (m.includes('password should be at least')) return 'Password too short (min 6 chars).';
    if (m.includes('email not confirmed')) return 'Please confirm your email.';
    if (m.includes('duplicate key') || m.includes('already exists')) return 'Phone or Email already in use.';
    return msg || 'An error occurred.';
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setErrorMsg(friendlyAuthError(error.message));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // --- MODO: COMPLETAR PERFIL (Vindo do Google) ---
      if (isCompletingProfile) {
          const phoneDigits = onlyDigits(formData.phone);
          const fullName = formData.name.trim();

          if (!fullName) throw new Error(t.auth.errorRequired);
          if (!phoneDigits || phoneDigits.length < 10) throw new Error(t.auth.errorPhone);

          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) throw new Error("User session not found");

          // Atualiza a tabela profiles diretamente, pois o usuário já existe
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone_e164: phoneDigits
            })
            .eq('id', user.id);

          if (updateError) {
             console.error(updateError);
             throw new Error('Erro ao salvar perfil. Tente novamente.');
          }

          setSuccessMsg(t.auth.successLogin);
          setTimeout(() => onSuccess(), 1500);
          return;
      }

      // --- MODO: REGISTRO NORMAL ---
      if (activeMode === 'register') {
        const email = (formData.email || '').trim().toLowerCase();
        const fullName = (formData.name || '').trim();
        const phoneDigits = onlyDigits(formData.phone);

        if (!fullName) throw new Error(t.auth.errorRequired);
        if (!email) throw new Error(t.auth.errorRequired);
        if (!phoneDigits) throw new Error(t.auth.errorRequired);
        if (phoneDigits.length < 10) throw new Error(t.auth.errorPhone);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: { emailRedirectTo: window.location.origin }
        });

        if (authError) throw authError;

        if (!authData.user) {
          setSuccessMsg(t.auth.successRegister);
          setTimeout(() => onSuccess(), 2000);
          return;
        }

        // Tenta registrar perfil via RPC (que faz insert)
        const { error: rpcError } = await supabase.rpc('register_user_profile', {
          p_full_name: fullName,
          p_phone: phoneDigits, 
          p_email: email
        });

        // Se der erro de duplicate key no RPC (significa que o auth criou mas o rpc falhou), tentamos update
        if (rpcError) {
             if (rpcError.message.includes('duplicate') || rpcError.message.includes('already exists')) {
                 // Fallback para update
                 const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ full_name: fullName, phone_e164: phoneDigits })
                    .eq('id', authData.user.id);
                 
                 if (updateError) throw new Error('Phone/Email already in use.');
             } else {
                 throw new Error('Phone/Email already in use.');
             }
        }

        setSuccessMsg(t.auth.successRegister);
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      // --- MODO: LOGIN NORMAL ---
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: (formData.email || '').trim().toLowerCase(),
        password: formData.password
      });

      if (loginError) throw loginError;

      setSuccessMsg(t.auth.successLogin);
      setTimeout(() => onSuccess(), 1500);

    } catch (error: any) {
      console.error('Auth Error:', error);
      setLoading(false);
      const rawMsg = error?.message || error?.error_description || 'Error';
      setErrorMsg(friendlyAuthError(rawMsg));
    }
  };

  const title = isCompletingProfile ? t.auth.completeProfile : (activeMode === 'login' ? t.auth.welcomeBack : t.auth.createAccount);
  const subtitle = isCompletingProfile ? t.auth.confirmPhone : (activeMode === 'login' ? t.auth.accessPanel : t.auth.fillToAccess);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isCompletingProfile ? undefined : onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
                </div>
                {!isCompletingProfile && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} />
                    </button>
                )}
              </div>

              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle size={18} className="shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Campos para Registro ou Completar Perfil */}
                {(activeMode === 'register' || isCompletingProfile) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.nameLabel}</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        disabled={!!successMsg}
                        className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {(activeMode === 'register' || isCompletingProfile) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.phoneLabel} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        required
                        disabled={!!successMsg}
                        className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50"
                        placeholder={t.auth.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 ml-1">{t.auth.phoneHelper}</p>
                  </div>
                )}

                {!isCompletingProfile && (
                    <>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.emailLabel}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                            type="email"
                            required
                            disabled={!!successMsg}
                            className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        </div>

                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.passwordLabel}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            disabled={!!successMsg}
                            className="w-full bg-white text-gray-900 pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all placeholder-gray-400 disabled:bg-gray-50"
                            placeholder="******"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                            type="button"
                            disabled={!!successMsg}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        </div>
                    </>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !!successMsg}
                    className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-80 disabled:cursor-not-allowed ${
                        successMsg 
                            ? 'bg-green-600 text-white shadow-green-500/25' 
                            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : successMsg ? (
                      <>
                        <CheckCircle size={20} />
                        {t.auth.btnSuccess}
                      </>
                    ) : (
                      <>
                        {isCompletingProfile ? t.auth.btnSave : (activeMode === 'login' ? t.auth.btnLogin : t.auth.btnRegister)}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Google Button & Toggle Mode */}
              {!isCompletingProfile && (
                  <div className="mt-6">
                     <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">{t.auth.or}</span></div>
                     </div>

                     <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading || !!successMsg}
                        className="w-full bg-white text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm"
                     >
                        <GoogleIcon />
                        {t.auth.googleBtn}
                     </button>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-500">
                        {activeMode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
                        <button
                            onClick={() => {
                                if(!loading && !successMsg) setActiveMode(activeMode === 'login' ? 'register' : 'login');
                            }}
                            disabled={loading || !!successMsg}
                            className="ml-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                            {activeMode === 'login' ? t.auth.registerLink : t.auth.loginLink}
                        </button>
                        </p>
                    </div>
                  </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={12} />
              {t.auth.security}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationModal;