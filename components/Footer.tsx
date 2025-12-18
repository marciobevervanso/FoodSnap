
import React from 'react';
import { Scan, Zap, MessageCircle, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  onRegister: () => void;
}

const Footer: React.FC<FooterProps> = ({ onRegister }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10 border-t border-slate-800 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group text-left">
              <div className="relative flex items-center justify-center w-10 h-10 bg-slate-800 rounded-xl border border-slate-700">
                <Scan size={20} className="text-brand-400" />
                <Zap size={10} className="absolute text-yellow-500 fill-yellow-500 -rotate-12 translate-y-0.5 translate-x-0.5" />
              </div>
              <span className="text-xl font-bold">
                FoodSnap<span className="text-brand-500">.ai</span>
              </span>
            </button>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Tecnologia de ponta para simplificar a nutrição e promover saúde acessível através de Inteligência Artificial Generativa.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-600 hover:text-white transition-all cursor-pointer"><Instagram size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-600 hover:text-white transition-all cursor-pointer"><Twitter size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-600 hover:text-white transition-all cursor-pointer"><Linkedin size={18} /></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Produto</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button onClick={() => navigate('/')} className="hover:text-brand-400">Como Funciona</button></li>
              <li><button onClick={() => navigate('/')} className="hover:text-brand-400">Funcionalidades</button></li>
              <li><button onClick={() => navigate('/')} className="hover:text-brand-400">Planos & Preços</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button className="hover:text-brand-400">Termos de Uso</button></li>
              <li><button className="hover:text-brand-400">Privacidade</button></li>
              <li><button className="hover:text-brand-400">Cookies</button></li>
            </ul>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h4 className="font-bold text-white mb-2">Acesso Rápido</h4>
            <p className="text-slate-400 text-xs mb-4">Comece sua transformação hoje mesmo com nossa IA.</p>
            <button 
              onClick={onRegister}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Experimentar Grátis
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} FoodSnap AI. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             Sistema Online
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
