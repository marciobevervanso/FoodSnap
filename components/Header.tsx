
import React, { useState, useEffect } from 'react';
import { Scan, Menu, X, Zap, ArrowRight, Calculator, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onRegister: () => void;
  onLogin: () => void;
  onOpenTools: () => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRegister, onLogin, onOpenTools, isLoggedIn }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-gray-200 py-3 shadow-sm' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group text-left">
          <div className="relative flex items-center justify-center w-11 h-11 bg-slate-950 rounded-xl border border-slate-800 shadow-lg group-hover:scale-105 transition-transform">
            <Scan size={24} className="text-brand-400" strokeWidth={1.25} />
            <Zap size={14} className="absolute text-yellow-500 fill-yellow-500 -rotate-12 translate-y-0.5 translate-x-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-900 leading-none">
              FoodSnap<span className="text-brand-600">.ai</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Nutrição Inteligente
            </span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => handleScrollTo('how-it-works')} className="text-sm font-bold text-slate-600 hover:text-brand-600">Como Funciona</button>
          <button onClick={() => handleScrollTo('features')} className="text-sm font-bold text-slate-600 hover:text-brand-600">Vantagens</button>
          <button onClick={() => handleScrollTo('pricing')} className="text-sm font-bold text-slate-600 hover:text-brand-600">Preços</button>
          
          <button 
            onClick={onOpenTools}
            className="flex items-center gap-1.5 text-xs font-black text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 uppercase tracking-tighter"
          >
            <Calculator size={14} /> Ferramentas
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {isLoggedIn ? (
            <button 
                onClick={() => navigate('/dashboard')}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
                <User size={16} /> Meu Painel
            </button>
          ) : (
            <>
                <button onClick={onLogin} className="text-sm font-bold text-slate-600">Login</button>
                <button 
                    onClick={onRegister}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2"
                >
                    Testar Grátis <ArrowRight size={16} />
                </button>
            </>
          )}
        </nav>

        <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl md:hidden p-6 flex flex-col gap-4">
           <button onClick={() => handleScrollTo('how-it-works')} className="text-left py-2 font-bold text-slate-700">Como Funciona</button>
           <button onClick={() => handleScrollTo('features')} className="text-left py-2 font-bold text-slate-700">Vantagens</button>
           <button onClick={() => handleScrollTo('pricing')} className="text-left py-2 font-bold text-slate-700">Preços</button>
           <hr />
           {isLoggedIn ? (
             <button onClick={() => navigate('/dashboard')} className="bg-brand-600 text-white py-4 rounded-xl font-bold">Meu Painel</button>
           ) : (
             <div className="flex flex-col gap-3">
               <button onClick={onLogin} className="py-2 font-bold text-slate-700">Login</button>
               <button onClick={onRegister} className="bg-brand-600 text-white py-4 rounded-xl font-bold">Testar Grátis</button>
             </div>
           )}
        </div>
      )}
    </header>
  );
};

export default Header;
