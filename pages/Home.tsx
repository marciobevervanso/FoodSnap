
import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import { Sparkles, ArrowRight, Zap, CheckCircle, ShieldCheck } from 'lucide-react';

interface HomeProps {
  onRegister: (plan?: string) => void;
  onLogin: () => void;
  onOpenTools: () => void;
}

const Home: React.FC<HomeProps> = ({ onRegister, onOpenTools }) => {
  return (
    <div className="flex flex-col w-full bg-white">
      {/* 1. Hero Section */}
      <Hero onRegister={() => onRegister('starter')} />

      {/* 2. Barra de Prova Social */}
      <div className="w-full bg-slate-50 border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-8">Tecnologia Confiada por Entusiastas de Saúde</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <div className="font-black text-2xl italic">HEALTH_TECH</div>
            <div className="font-black text-2xl italic">FITNESS_PRO</div>
            <div className="font-black text-2xl italic">BODY_SCAN</div>
            <div className="font-black text-2xl italic">NUTRI_INSIGHT</div>
          </div>
        </div>
      </div>

      {/* 3. Como Funciona */}
      <HowItWorks />

      {/* 4. Funcionalidades */}
      <Features />

      {/* 5. Seção de Conversão Intermediária */}
      <section className="w-full py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-600/10 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <span className="text-brand-400 font-black uppercase tracking-widest text-sm mb-4 block">Precisão Cirúrgica</span>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                Esqueça as planilhas e o chute de calorias.
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Nossa IA foi treinada com milhões de imagens para identificar não apenas o alimento, mas o tamanho da porção e a densidade calórica real.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-brand-500" size={24} />
                  <span className="font-bold">Visão Computacional 2.0</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-brand-500" size={24} />
                  <span className="font-bold">Análise de Micronutrientes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-brand-500" size={24} />
                  <span className="font-bold">Coach de Voz via Zap</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-brand-500" size={24} />
                  <span className="font-bold">Relatórios em PDF</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                 <div className="flex items-center gap-4 mb-6">
                    <Zap className="text-yellow-400" fill="currentColor" size={32} />
                    <h4 className="text-xl font-bold">94% de Precisão</h4>
                 </div>
                 <p className="text-slate-400 mb-8 italic text-lg">"O FoodSnap identificou até o tipo de gordura que eu usei no preparo. Surreal!"</p>
                 <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 w-[94%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testemunhos */}
      <Testimonials />

      {/* 7. Preços */}
      <Pricing onRegister={onRegister} />

      {/* 8. FAQ */}
      <FAQ />

      {/* 9. CTA Final */}
      <section className="w-full py-24 bg-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex p-4 bg-brand-500 rounded-2xl mb-8 shadow-2xl text-white">
            <Sparkles size={40} fill="currentColor" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
            Pare de tentar.<br/>Comece a conseguir.
          </h2>
          <p className="text-brand-100 text-xl mb-12 font-medium">
            Junte-se a 25.000+ usuários que transformaram o corpo sem pesar uma única grama de comida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onRegister('starter')}
              className="w-full sm:w-auto bg-white text-brand-600 hover:bg-slate-100 px-12 py-6 rounded-2xl text-2xl font-black shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              Começar Agora
              <ArrowRight size={28} />
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-brand-100 text-sm font-bold">
            <ShieldCheck size={18} /> Sem cartão de crédito necessário para testar
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
