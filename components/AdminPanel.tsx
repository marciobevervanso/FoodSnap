import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  LogOut, 
  ArrowLeft, 
  TrendingUp, 
  Ticket, 
  Search,
  ShieldAlert,
  Download,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  UserPlus,
  Activity,
  AlertTriangle,
  User,
  Clock,
  Info,
  Settings,
  Save,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../App';

interface AdminPanelProps {
  user: AppUser;
  onExitAdmin: () => void;
  onLogout: () => void;
}

// Tipos baseados nas novas tabelas SQL
type TabType = 'overview' | 'users' | 'financial' | 'coupons' | 'settings';

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onExitAdmin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  
  // Settings State
  const [config, setConfig] = useState({
      whatsapp_number: '' // Inicializa vazio para não confundir
  });
  const [savingConfig, setSavingConfig] = useState(false);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', percent: 10, uses: 100 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const { data: sData } = await supabase.rpc('get_admin_dashboard_stats');
      if (sData) setStats(sData);

      // 2. Users (Robust Fetch)
      await fetchUsersSafe();

      // 3. Coupons
      const { data: cData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (cData) setCoupons(cData);

      // 4. Settings
      const { data: configData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle();
      
      if (configData) {
          setConfig({ whatsapp_number: configData.value });
      } else {
          // Fallback visual apenas se não tiver nada no banco
          setConfig({ whatsapp_number: '5541999999999' });
      }

    } catch (error) {
      console.error("Admin fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersSafe = async () => {
    // Tenta usar a função avançada (RPC) que tem dados do plano
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_users_list', { limit_count: 50 });
    
    if (!rpcError && rpcData) {
        setUsersList(rpcData);
        return;
    }

    // Se falhar (ex: SQL não atualizado), busca o básico da tabela profiles para não deixar a tela vazia
    console.warn("RPC falhou, usando fallback de perfis:", rpcError);
    const { data: basicData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
    if (basicData) {
        const mapped = basicData.map(p => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            phone: p.phone_e164,
            created_at: p.created_at,
            plan_status: 'free',
            plan_interval: 'free',
            lifetime_value: 0,
            plan_start_date: null,
            plan_end_date: null
        }));
        setUsersList(mapped);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.rpc('admin_create_coupon', {
        p_code: newCoupon.code,
        p_percent: newCoupon.percent,
        p_uses: newCoupon.uses
      });
      
      if (error) throw error;
      
      const { data: cData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (cData) setCoupons(cData);
      
      setShowCouponModal(false);
      setNewCoupon({ code: '', percent: 10, uses: 100 });
      alert("Cupom criado com sucesso!");
    } catch (err: any) {
      alert("Erro ao criar cupom: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingConfig(true);
      try {
          const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'whatsapp_number', value: config.whatsapp_number }, { onConflict: 'key' });

          if (error) throw error;
          alert("Configurações salvas com sucesso!");
      } catch (err: any) {
          console.error(err);
          alert("Erro ao salvar: " + err.message);
      } finally {
          setSavingConfig(false);
      }
  };

  // Safe filter logic (handles null names)
  const filteredUsers = usersList.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-gray-900 flex">
      
      {/* Sidebar Premium */}
      <aside className="w-72 bg-gray-900 text-white fixed h-full z-30 hidden lg:flex flex-col shadow-2xl">
        <div className="p-8 border-b border-gray-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <ShieldAlert size={20} />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight block">FoodSnap</span>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded-full">Master Admin</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users size={20} />} 
            label="Usuários & Planos" 
          />
          <NavButton 
            active={activeTab === 'financial'} 
            onClick={() => setActiveTab('financial')} 
            icon={<DollarSign size={20} />} 
            label="Financeiro" 
          />
          <NavButton 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
            icon={<Ticket size={20} />} 
            label="Cupons & Ofertas" 
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20} />} 
            label="Configurações" 
          />
        </nav>

        <div className="p-6 border-t border-gray-800 space-y-2 bg-gray-950/30">
           <button 
            onClick={onExitAdmin}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium"
           >
             <ArrowLeft size={18} />
             Voltar ao App
           </button>
           <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors text-sm font-medium"
           >
             <LogOut size={18} />
             Sair
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-6 md:p-10 overflow-y-auto">
        {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        ) : (
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                          {activeTab === 'overview' && 'Visão Geral'}
                          {activeTab === 'users' && 'Gestão de Usuários'}
                          {activeTab === 'financial' && 'Controle Financeiro'}
                          {activeTab === 'coupons' && 'Cupons de Desconto'}
                          {activeTab === 'settings' && 'Configurações do Sistema'}
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                           Sistema Operacional • {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                         {activeTab !== 'settings' && (
                             <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2">
                                 <Download size={16} /> Exportar Relatório
                             </button>
                         )}
                         {activeTab === 'coupons' && (
                           <button 
                              onClick={() => setShowCouponModal(true)}
                              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-brand-500/20 hover:bg-brand-700 flex items-center gap-2"
                           >
                              <Plus size={16} /> Criar Cupom
                           </button>
                         )}
                    </div>
                </div>

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard 
                                title="Receita Total" 
                                value={formatCurrency(stats.total_revenue || 0)} 
                                icon={<DollarSign className="text-white" size={24} />} 
                                color="bg-emerald-500"
                                trend="+8.2%"
                            />
                            <KpiCard 
                                title="Assinantes Ativos" 
                                value={stats.active_subs} 
                                icon={<CreditCard className="text-white" size={24} />} 
                                color="bg-blue-500"
                                trend="+12"
                            />
                            <KpiCard 
                                title="Total Usuários" 
                                value={stats.total_users} 
                                icon={<Users className="text-white" size={24} />} 
                                color="bg-indigo-500"
                                trend="+24"
                            />
                            <KpiCard 
                                title="Novos (24h)" 
                                value={stats.new_users_24h} 
                                icon={<UserPlus className="text-white" size={24} />} 
                                color="bg-purple-500"
                                trend="Hoje"
                            />
                        </div>

                        {/* Recent Activity Section */}
                        <div className="grid lg:grid-cols-3 gap-8">
                           {/* Chart placeholder area */}
                           <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                              <h3 className="font-bold text-gray-900 mb-6">Crescimento de Receita (Simulado)</h3>
                              <div className="h-64 flex items-end gap-4">
                                  {[40, 65, 50, 80, 75, 90, 85, 100].map((h, i) => (
                                      <div key={i} className="flex-1 bg-brand-50 rounded-t-lg relative group">
                                          <div 
                                            className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-lg transition-all duration-1000 group-hover:bg-brand-600"
                                            style={{ height: `${h}%` }}
                                          ></div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
                                  <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span>
                              </div>
                           </div>

                           {/* Quick Actions / Recent */}
                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                               <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                               <div className="space-y-3">
                                   <button onClick={() => setShowCouponModal(true)} className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3">
                                       <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Ticket size={18} /></div>
                                       <div>
                                           <p className="font-bold text-sm text-gray-800">Criar Novo Cupom</p>
                                           <p className="text-xs text-gray-500">Impulsione vendas hoje</p>
                                       </div>
                                   </button>
                                   <button onClick={() => setActiveTab('users')} className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3">
                                       <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Search size={18} /></div>
                                       <div>
                                           <p className="font-bold text-sm text-gray-800">Buscar Usuário</p>
                                           <p className="text-xs text-gray-500">Ver detalhes de conta</p>
                                       </div>
                                   </button>
                               </div>
                           </div>
                        </div>
                    </div>
                )}

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome ou email..." 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4">Usuário</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Plano</th>
                                            <th className="px-6 py-4">Início</th>
                                            <th className="px-6 py-4">Término</th>
                                            <th className="px-6 py-4">LTV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                                    Nenhum usuário encontrado na busca.
                                                </td>
                                            </tr>
                                        ) : filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                                                            {u.full_name ? u.full_name.substring(0,2).toUpperCase() : 'US'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{u.full_name || 'Usuário Sem Nome'}</div>
                                                            <div className="text-xs text-gray-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={u.plan_status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <IntervalBadge interval={u.plan_interval} />
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-medium text-xs">
                                                    {u.plan_start_date ? (
                                                        <span className="text-green-700 font-bold">{formatDate(u.plan_start_date)}</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-gray-400" title="Data de Cadastro">
                                                            <Clock size={12} />
                                                            {formatDate(u.created_at)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-medium text-xs">
                                                    {u.plan_end_date ? formatDate(u.plan_end_date) : <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium text-gray-700">
                                                    {formatCurrency(u.lifetime_value || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- COUPONS TAB --- */}
                {activeTab === 'coupons' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                             <div>
                                <h2 className="text-2xl font-bold mb-2">Marketing & Ofertas</h2>
                                <p className="text-purple-100 opacity-90 max-w-lg">
                                    Crie códigos promocionais para influenciadores, campanhas de email ou recuperação de carrinho.
                                </p>
                             </div>
                             <button 
                                onClick={() => setShowCouponModal(true)}
                                className="bg-white text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-xl"
                             >
                                Criar Novo Cupom
                             </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coupons.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                    Nenhum cupom ativo no momento.
                                </div>
                            ) : coupons.map(c => (
                                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-50">
                                        <Ticket size={80} className="text-gray-100 -rotate-12 transform translate-x-4 -translate-y-4" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-mono font-bold text-sm border border-purple-100">
                                                {c.code}
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {c.is_active ? 'ATIVO' : 'INATIVO'}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <span className="text-4xl font-black text-gray-900">{c.discount_percent}%</span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">OFF</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-1">
                                                <Users size={14} />
                                                <span>{c.uses_count} / {c.max_uses} usos</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>Criado em {new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-6 border-b border-gray-100">
                                 <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                     <Smartphone size={20} className="text-brand-600" />
                                     Integração WhatsApp
                                 </h2>
                                 <p className="text-gray-500 text-sm mt-1">
                                     Configure o número que receberá as mensagens e imagens dos usuários para análise.
                                 </p>
                             </div>
                             <div className="p-6 space-y-6">
                                 <form onSubmit={handleSaveSettings}>
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Número do WhatsApp (Business/Bot)
                                         </label>
                                         <div className="flex gap-2">
                                             <input 
                                                type="text" 
                                                required
                                                className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 placeholder-gray-400"
                                                placeholder="Ex: 5541999999999"
                                                value={config.whatsapp_number}
                                                onChange={(e) => setConfig({...config, whatsapp_number: e.target.value.replace(/\D/g, '')})}
                                             />
                                             <button 
                                                type="button"
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                                onClick={() => window.open(`https://wa.me/${config.whatsapp_number}`, '_blank')}
                                             >
                                                 Testar Link
                                             </button>
                                         </div>
                                         <p className="text-xs text-gray-500 mt-2">
                                             Insira apenas números, incluindo o código do país (Ex: 55 para Brasil). Este número será usado para gerar o QR Code no painel do usuário.
                                         </p>
                                     </div>

                                     <div className="pt-6 border-t border-gray-100 flex justify-end">
                                         <button 
                                            type="submit" 
                                            disabled={savingConfig}
                                            className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/20 flex items-center gap-2 disabled:opacity-50"
                                         >
                                             {savingConfig ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div> : <Save size={18} />}
                                             Salvar Configurações
                                         </button>
                                     </div>
                                 </form>
                             </div>
                         </div>
                    </div>
                )}

                {/* --- FINANCIAL TAB --- */}
                {activeTab === 'financial' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CreditCard size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Integração Stripe Connect</h2>
                            <p className="text-gray-500 max-w-lg mx-auto mb-6">
                                Para visualizar o histórico detalhado de transações em tempo real, configure os Webhooks do Stripe no backend. O sistema atual está pronto para receber os dados na tabela <code>payments</code>.
                            </p>
                            <button className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2">
                                <ExternalLinkIcon /> Acessar Dashboard do Stripe
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Criar Novo Cupom</h3>
                
                <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-sm flex gap-3">
                   <Info className="shrink-0 mt-0.5" size={18} />
                   <p>
                     <strong>Atenção:</strong> Ao criar o cupom aqui, você apenas registra para métricas internas. <br/>
                     <span className="block mt-2 font-medium underline">Você deve criar o mesmo código de cupom no Dashboard do Stripe</span> para que o desconto funcione no checkout.
                   </p>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Cupom</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 uppercase bg-white text-gray-900"
                            placeholder="EX: VERÃO2025"
                            value={newCoupon.code}
                            onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
                            <input 
                                type="number" 
                                required
                                min="1" max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
                                value={newCoupon.percent}
                                onChange={e => setNewCoupon({...newCoupon, percent: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Usos</label>
                            <input 
                                type="number" 
                                required
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
                                value={newCoupon.uses}
                                onChange={e => setNewCoupon({...newCoupon, uses: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setShowCouponModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/20"
                        >
                            Criar Cupom
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
        {icon}
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const KpiCard = ({ title, value, icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden group">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h4 className="text-2xl font-black text-gray-900">{value}</h4>
            {trend && (
                <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    <TrendingUp size={12} /> {trend}
                </div>
            )}
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    let styles = 'bg-gray-100 text-gray-600';
    let icon = <MoreHorizontal size={12} />;
    let label = status;
    
    if (status === 'pro') {
        styles = 'bg-green-100 text-green-700 border border-green-200';
        icon = <CheckCircle2 size={12} />;
    }
    else if (status === 'trial') {
        styles = 'bg-orange-100 text-orange-700 border border-orange-200';
        icon = <Activity size={12} />;
    }
    else if (status === 'free' || !status) {
        return (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                <User size={12} /> Gratuito
            </span>
        );
    }
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles}`}>
            {icon} {label}
        </span>
    );
};

const IntervalBadge = ({ interval }: { interval: string }) => {
    if (interval === 'free' || !interval) {
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">Básico</span>;
    }
    
    let color = 'bg-gray-100 text-gray-600';
    let label = interval;

    if (interval === 'monthly') { color = 'bg-blue-50 text-blue-700 border border-blue-100'; label = 'Mensal'; }
    if (interval === 'quarterly') { color = 'bg-indigo-50 text-indigo-700 border border-indigo-100'; label = 'Trimestral'; }
    if (interval === 'annual') { color = 'bg-purple-50 text-purple-700 border border-purple-100'; label = 'Anual'; }

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${color}`}>
            {label}
        </span>
    );
};

const ExternalLinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);

export default AdminPanel;