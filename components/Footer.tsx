import React from 'react';
import { Scan, Zap, MessageCircle, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  onRegister: () => void;
  onNavigate?: (view: 'home' | 'faq') => void;
}

const Footer: React.FC<FooterProps> = ({ onRegister }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleFaqClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/faq');
    window.scrollTo(0, 0);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <a href="/" onClick={handleLogoClick} className="flex items-center gap-2 group w-fit">
              <div className="relative flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl border border-gray-700 group-hover:border-brand-500 transition-colors">
                <Scan size={20} className="text-gray-400 group-hover:text-brand-400 transition-colors" />
                <Zap size={10} className="absolute text-yellow-500 fill-yellow-500 -rotate-12 translate-y-0.5 translate-x-0.5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                FoodSnap<span className="text-brand-500">.ai</span>
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t.footer.desc}
            </p>
            <div className="flex gap-4">
              <SocialButton icon={<Instagram size={18} />} />
              <SocialButton icon={<Twitter size={18} />} />
              <SocialButton icon={<Linkedin size={18} />} />
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-white mb-6">{t.footer.platform}</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#how-it-works" className="hover:text-brand-400 transition-colors">Como Funciona</a></li>
              <li><a href="#features" className="hover:text-brand-400 transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-brand-400 transition-colors">Planos & Preços</a></li>
              <li><button onClick={handleFaqClick} className="hover:text-brand-400 transition-colors">Central de Ajuda</button></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-white mb-6">{t.footer.legal}</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Cookies</a></li>
            </ul>
          </div>

          {/* CTA Column */}
          <div className="lg:col-span-1">
             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h4 className="font-bold text-white mb-2">{t.footer.ctaTitle}</h4>
                <p className="text-gray-400 text-xs mb-4">{t.footer.ctaDesc}</p>
                <button 
                  onClick={onRegister}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  {t.footer.ctaBtn}
                </button>
             </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FoodSnap AI. {t.footer.rights}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             System Operational
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialButton = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-600 hover:text-white transition-all border border-gray-700 hover:border-brand-500">
    {icon}
  </a>
);

export default Footer;