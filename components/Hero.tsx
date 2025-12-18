
import React, { useState, useRef } from 'react';
import { ArrowRight, Scan, Zap, Camera, Lightbulb, Sparkles, Upload, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onRegister: () => void;
}

const Hero: React.FC<HeroProps> = ({ onRegister }) => {
  const [demoState, setDemoState] = useState<'initial' | 'analyzing' | 'result'>('initial');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [showDemoInstruction, setShowDemoInstruction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleDemoClick = () => setShowDemoInstruction(true);
  const handleTriggerUpload = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setShowDemoInstruction(false);
      setDemoState('analyzing');
      setTimeout(() => setDemoState('result'), 2500);
    }
  };

  return (
    <section className="relative w-full min-h-screen lg:min-h-[90vh] flex items-center pt-24 pb-12 bg-white overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-50/50 rounded-l-[100px] -z-10 hidden lg:block" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-100/30 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-black uppercase tracking-widest shadow-sm">
              <Sparkles size={14} className="text-brand-500" />
              Nutrição Baseada em IA
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tight">
              Sua dieta,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-400">
                num estalo.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              O <span className="text-brand-600 font-bold">FoodSnap.ai</span> usa visão computacional para calcular calorias e macros direto no seu WhatsApp. Sem balanças, sem estresse.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <button 
                onClick={onRegister}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-700 text-white px-10 py-5 rounded-2xl text-2xl font-black shadow-2xl shadow-brand-500/40 transition-all hover:-translate-y-1"
              >
                Começar Grátis
                <ArrowRight size={24} />
              </button>
              <button 
                onClick={handleDemoClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-brand-200 text-slate-700 px-8 py-5 rounded-2xl text-xl font-bold transition-all shadow-sm"
              >
                <Camera size={22} className="text-brand-600" />
                Testar Demo
              </button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-4">
               <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-12 h-12 rounded-full border-4 border-white shadow-md" alt="User" />
                  ))}
               </div>
               <p className="text-slate-500 font-bold text-sm">25.000+ usuários ativos</p>
            </div>
          </div>

          <div className="flex-1 relative w-full flex justify-center lg:justify-end">
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-400 to-emerald-400 rounded-[4rem] blur-2xl opacity-20 transition-opacity"></div>
                
                {/* Celular Mockup */}
                <div className="relative z-10 w-[310px] sm:w-[340px] bg-slate-950 rounded-[3.5rem] border-[10px] border-slate-950 shadow-3xl overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-slate-950 rounded-b-3xl z-30"></div>
                    
                    <div className="w-full h-[640px] sm:h-[680px] bg-slate-50 flex flex-col">
                        <div className="bg-white p-5 pt-12 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Scan size={20} />
                                </div>
                                <div>
                                    <span className="font-black text-sm tracking-tighter block">FOODSNAP</span>
                                    <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Online</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-5 flex flex-col gap-6 overflow-hidden">
                             <div className="self-end max-w-[85%] bg-brand-600 p-1.5 rounded-3xl rounded-tr-sm shadow-xl">
                                 <img 
                                    src={userImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"} 
                                    className="rounded-2xl w-full h-40 object-cover" 
                                    alt="Refeição" 
                                 />
                             </div>

                             {demoState === 'analyzing' && (
                               <div className="self-start bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                                  <Loader2 className="animate-spin text-brand-600" size={18} />
                                  <span className="text-sm font-bold text-slate-500">FoodSnap analisando...</span>
                               </div>
                             )}

                             {demoState === 'result' && (
                               <div className="self-start w-full bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
                                  <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-50">
                                     <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resultado</span>
                                     </div>
                                     <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">SAUDÁVEL</span>
                                  </div>

                                  <div className="space-y-6">
                                     <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Estimativa</p>
                                            <h4 className="text-4xl font-black text-slate-900 tracking-tight">542 <span className="text-sm font-normal text-slate-400">kcal</span></h4>
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">P</span>
                                            <span className="font-black text-slate-800">32g</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">C</span>
                                            <span className="font-black text-slate-800">54g</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">G</span>
                                            <span className="font-black text-slate-800">18g</span>
                                        </div>
                                     </div>

                                     <div className="bg-brand-50 p-4 rounded-2xl flex gap-3 border border-brand-100">
                                        <Lightbulb size={20} className="text-brand-600 shrink-0" />
                                        <p className="text-[11px] text-brand-900 leading-snug font-medium">
                                            <b>Dica Pro:</b> Adicione mais fibras para manter a saciedade por mais tempo.
                                        </p>
                                     </div>
                                  </div>
                               </div>
                             )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                            <div className="flex-1 h-10 bg-slate-100 rounded-full px-4 flex items-center text-slate-400 text-sm">Digite uma mensagem...</div>
                            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white"><ArrowRight size={18} /></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {showDemoInstruction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setShowDemoInstruction(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100">
              <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-600">
                  <Camera size={44} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">Teste o FoodSnap</h3>
              <p className="text-slate-500 mb-10 text-lg font-medium">Envie uma foto da sua última refeição para ver a análise instantânea.</p>
              <button 
                onClick={handleTriggerUpload} 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
              >
                  <Upload size={24} /> 
                  Selecionar Foto
              </button>
            </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
