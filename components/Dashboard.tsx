import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  History,
  CreditCard,
  LogOut,
  Search,
  ChevronRight,
  Zap,
  ExternalLink,
  MessageCircle,
  Loader2,
  ShieldAlert,
  Smartphone,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

type AccessSummary = {
  free_used: number;
  free_remaining: number;
  plan_active: boolean;
  plan_code: string; // free | mensal | trimestral | anual | ...
  plan_started_at: string | null;
  plan_valid_until: string | null;
  can_use_paid: boolean;
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onOpenAdmin }) => {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'subscription'>('overview');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [stats, setStats] = useState({ totalCount: 0, avgCals: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState('5541999999999');

  // ✅ NOVO: resumo de acesso (free quota / plano / validade)
  const [access, setAccess] = useState<AccessSummary | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchStats();
    fetchSystemSettings();
    fetchAccess();

    const settingsChannel = supabase
      .channel('public:app_settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.whatsapp_number',
        },
        (payload) => {
          if (payload.new && (payload.new as any).value) {
            setWhatsappNumber((payload.new as any).value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchSystemSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle();

      if (data && (data as any).value) {
        setWhatsappNumber((data as any).value);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  // ✅ NOVO: busca da view (ou tabela) de resumo de acesso
  const fetchAccess = async () => {
    setLoadingAccess(true);
    try {
      const { data, error } = await supabase
        .from('user_access_summary')
        .select(
          'free_used, free_remaining, plan_active, plan_code, plan_started_at, plan_valid_until, can_use_paid'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setAccess({
        free_used: (data as any)?.free_used ?? 0,
        free_remaining: (data as any)?.free_remaining ?? 5,
        plan_active: !!(data as any)?.plan_active,
        plan_code: ((data as any)?.plan_code ?? 'free').toString(),
        plan_started_at: (data as any)?.plan_started_at ?? null,
        plan_valid_until: (data as any)?.plan_valid_until ?? null,
        can_use_paid: !!(data as any)?.can_use_paid,
      });
    } catch (err) {
      console.error('Error fetching access summary:', err);
      setAccess(null);
    } finally {
      setLoadingAccess(false);
    }
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Oi`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    whatsappUrl
  )}`;

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { count, error: countError } = await supabase
        .from('food_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      const { data: calData, error: calError } = await supabase
        .from('food_analyses')
        .select('total_calories')
        .eq('user_id', user.id);

      if (calError) throw calError;

      let calculatedAvg = 0;
      if (calData && calData.length > 0) {
        const sum = (calData as any[]).reduce((acc, curr) => acc + (curr.total_calories || 0), 0);
        calculatedAvg = Math.round(sum / calData.length);
      }

      setStats({
        totalCount: count || 0,
        avgCals: calculatedAvg,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('food_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
        return;
      }

      if (data) {
        const formatted = (data as any[]).map((item: any) => {
          let itemDetails = '';
          try {
            const structured =
              typeof item.ai_structured === 'string' ? JSON.parse(item.ai_structured) : item.ai_structured;

            if (structured?.items && Array.isArray(structured.items)) {
              itemDetails = structured.items.map((i: any) => i.name).join(', ');
            }
          } catch (e) {
            console.log('Error parsing AI structure', e);
          }

          const bucketUrl = `https://mnhgpnqkwuqzpvfrwftp.supabase.co/storage/v1/object/public/consultas/${item.user_id}/${item.id}.jpg`;

          return {
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            category: item.category || 'Refeição',
            details: itemDetails,
            score: item.nutrition_score || 0,
            cals: Math.round(item.total_calories || 0),
            protein: Math.round(item.total_protein || 0) + 'g',
            carbs: Math.round(item.total_carbs || 0) + 'g',
            fat: Math.round(item.total_fat || 0) + 'g',
            img: bucketUrl,
          };
        });
        setHistory(formatted);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStripePortal = () => {
    alert('Redirecionando para o Portal do Cliente Stripe...');
    window.open('https://billing.stripe.com/p/login/test', '_blank');
  };

  const getPlanLabelFromUser = () => {
    if (user.plan === 'pro') return 'PRO';
    if (user.plan === 'trial') return 'Trial';
    if (language === 'pt') return 'Gratuito';
    if (language === 'es') return 'Gratis';
    return 'Free';
  };

  const planLabelFromCode = (code?: string) => {
    const c = (code || 'free').toLowerCase();
    if (c === 'free') return language === 'pt' ? 'Gratuito' : 'Free';
    if (c === 'mensal') return 'Mensal';
    if (c === 'trimestral') return 'Trimestral';
    if (c === 'anual') return 'Anual';
    if (c === 'pro') return 'PRO';
    if (c === 'trial') return 'Trial';
    return c.toUpperCase();
  };

  const planName = planLabelFromCode(access?.plan_code) || getPlanLabelFromUser();
  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

  const isPaidActive = !!access?.can_use_paid && access?.plan_code !== 'free';

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center text-brand-400">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">FoodSnap</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label={t.dashboard.menuOverview}
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <SidebarItem
            icon={<History size={20} />}
            label={t.dashboard.menuHistory}
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <SidebarItem
            icon={<CreditCard size={20} />}
            label={t.dashboard.menuSubscription}
            active={activeTab === 'subscription'}
            onClick={() => setActiveTab('subscription')}
          />

          {onOpenAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              >
                <ShieldAlert size={20} className="text-red-500" />
                <span className="text-sm font-medium">Admin Panel</span>
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            {t.dashboard.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="md:hidden flex justify-between items-center mb-6">
          <span className="font-bold text-lg">FoodSnap</span>
          <div className="flex gap-2">
            {onOpenAdmin && (
              <button onClick={onOpenAdmin} className="p-2 text-gray-500 hover:text-red-600">
                <ShieldAlert size={20} />
              </button>
            )}
            <button onClick={onLogout}>
              <LogOut size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t.dashboard.hello}, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                ID:{' '}
                <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                  {user.public_id || 'Carregando...'}
                </span>
                <span className="text-gray-300">•</span>
                {t.dashboard.status}:{' '}
                <span className="font-semibold text-green-600 capitalize flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ativo
                </span>
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title={t.dashboard.statDishes}
                value={loadingStats ? '...' : stats.totalCount.toString()}
                sub={t.dashboard.statDishesSub}
                icon={<Search className="text-blue-500" />}
              />
              <StatCard
                title={t.dashboard.statCals}
                value={loadingStats ? '...' : stats.avgCals.toString()}
                sub={t.dashboard.statCalsSub}
                icon={<Zap className="text-yellow-500" />}
              />
              <StatCard
                title={t.dashboard.statPlan}
                value={loadingAccess ? '...' : planName}
                sub={
                  loadingAccess
                    ? '...'
                    : access?.plan_code?.toLowerCase() === 'free'
                    ? `Grátis: ${access?.free_remaining ?? 0}/5 análises restantes`
                    : access?.plan_valid_until
                    ? `Válido até ${new Date(access.plan_valid_until).toLocaleDateString('pt-BR')}`
                    : 'Plano ativo'
                }
                icon={<CreditCard className="text-brand-500" />}
                highlight={isPaidActive || user.plan === 'trial'}
              />
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

              <div className="flex-1 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-3">
                    <Smartphone size={14} /> WhatsApp
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {t.dashboard.connectTitle} 🚀
                  </h2>
                  <p className="text-gray-500 leading-relaxed">{t.dashboard.connectDesc}</p>
                </div>

                <div className="space-y-4">
                  <Step number="1" text={t.dashboard.step1} />
                  <Step number="2" text={t.dashboard.step2} />
                  <Step number="3" text={t.dashboard.step3} />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => window.open(whatsappUrl, '_blank')}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5"
                  >
                    <MessageCircle size={20} />
                    {t.dashboard.btnWhatsapp}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-2xl border border-gray-100 relative">
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 mb-3 relative group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full">
                    <div className="bg-green-500 p-1.5 rounded-full">
                      <MessageCircle size={16} className="text-white" fill="currentColor" />
                    </div>
                  </div>
                  <img
                    key={whatsappNumber}
                    src={qrCodeUrl}
                    alt="WhatsApp QR Code"
                    className="w-40 h-40 mix-blend-multiply"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <QrCode size={14} /> {t.dashboard.scanLabel}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">{t.dashboard.recentTitle}</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-brand-600 text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  {t.dashboard.viewAll} <ChevronRight size={16} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-gray-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                  {t.dashboard.emptyRecent}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {history.slice(0, 4).map((item) => (
                    <HistoryCard key={item.id} item={item} fallback={fallbackImage} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t.dashboard.historyTitle}</h1>
              <p className="text-gray-500">{t.dashboard.historySubtitle}</p>
            </header>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={t.dashboard.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">{t.dashboard.emptyHistory}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-brand-200 transition-colors"
                  >
                    <div className="shrink-0 relative w-full sm:w-28 h-28 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.img}
                        alt={item.category}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== fallbackImage) target.src = fallbackImage;
                        }}
                        className="w-full h-full object-cover"
                      />
                      {item.score > 0 && (
                        <div
                          className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white ${
                            item.score >= 80 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        >
                          {item.score}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{item.category}</h4>
                          {item.details && <p className="text-xs text-gray-500 line-clamp-1">{item.details}</p>}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{item.date}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <MacroBadge label="Kcal" value={item.cals} color="bg-gray-100 text-gray-800" />
                        <MacroBadge label="Prot" value={item.protein} color="bg-brand-50 text-brand-700" />
                        <MacroBadge label="Carb" value={item.carbs} color="bg-blue-50 text-blue-700" />
                        <MacroBadge label="Gord" value={item.fat} color="bg-yellow-50 text-yellow-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t.dashboard.subTitle}</h1>
              <p className="text-gray-500">{t.dashboard.subDesc}</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">
                      {t.dashboard.currentPlan}
                    </p>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      {loadingAccess ? '...' : planName}
                      {(isPaidActive || user.plan === 'trial') && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full border border-brand-200">
                          Ativo
                        </span>
                      )}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {loadingAccess ? (
                        'Carregando...'
                      ) : access?.plan_code?.toLowerCase() === 'free' ? (
                        <>
                          Plano grátis • Restam <b>{access?.free_remaining ?? 0}</b> de 5 análises
                        </>
                      ) : (
                        <>
                          Início:{' '}
                          {access?.plan_started_at
                            ? new Date(access.plan_started_at).toLocaleDateString('pt-BR')
                            : '—'}
                          {' • '}
                          Vence:{' '}
                          {access?.plan_valid_until
                            ? new Date(access.plan_valid_until).toLocaleDateString('pt-BR')
                            : '—'}
                        </>
                      )}
                    </p>
                  </div>

                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      isPaidActive ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500 text-center sm:text-left">{t.dashboard.portalText}</p>
                <button
                  onClick={handleStripePortal}
                  className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                  <ExternalLink size={16} />
                  {t.dashboard.btnPortal}
                </button>
              </div>
            </div>

            {(access?.plan_code?.toLowerCase() === 'free' || !isPaidActive) && (
              <div className="mt-8 bg-brand-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">{t.dashboard.upgradeTitle}</h3>
                  <p className="text-brand-100 mb-6 max-w-lg">{t.dashboard.upgradeDesc}</p>
                  <button className="bg-brand-500 hover:bg-brand-400 text-brand-950 font-bold px-6 py-3 rounded-xl transition-colors">
                    {t.dashboard.btnUpgrade}
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const Step = ({ number, text }: { number: string; text: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 font-bold flex items-center justify-center border border-green-200 shrink-0">
      {number}
    </div>
    <p className="text-gray-700 font-medium">{text}</p>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard = ({ title, value, sub, icon, highlight }: any) => (
  <div
    className={`p-6 rounded-2xl border ${
      highlight ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-100'
    } shadow-sm flex items-start justify-between`}
  >
    <div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h4 className={`text-2xl font-extrabold ${highlight ? 'text-brand-900' : 'text-gray-900'}`}>{value}</h4>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
    <div className={`p-2 rounded-lg ${highlight ? 'bg-brand-100' : 'bg-gray-50'}`}>{icon}</div>
  </div>
);

const HistoryCard = ({ item, fallback }: any) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
    <div className="h-32 overflow-hidden relative bg-gray-100">
      <img
        src={item.img}
        alt={item.category}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallback) target.src = fallback;
        }}
      />
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">
        {item.cals} kcal
      </div>
      {item.score > 0 && (
        <div
          className={`absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white ${
            item.score >= 80 ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        >
          Score {item.score}
        </div>
      )}
    </div>
    <div className="p-3 flex-1 flex flex-col">
      <h5 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{item.category}</h5>
      {item.details && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.details}</p>}
      <p className="text-[10px] text-gray-400 mb-2 mt-auto">{item.date}</p>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-50 rounded px-1 py-1 text-center">
          <span className="block text-[8px] text-gray-400 font-bold uppercase">Prot</span>
          <span className="text-xs font-semibold text-gray-700">{item.protein}</span>
        </div>
        <div className="flex-1 bg-gray-50 rounded px-1 py-1 text-center">
          <span className="block text-[8px] text-gray-400 font-bold uppercase">Carb</span>
          <span className="text-xs font-semibold text-gray-700">{item.carbs}</span>
        </div>
      </div>
    </div>
  </div>
);

const MacroBadge = ({ label, value, color }: any) => (
  <div className={`px-3 py-1 rounded-lg text-xs font-medium ${color}`}>
    <span className="opacity-70 mr-1">{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default Dashboard;
