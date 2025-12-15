import React from 'react';
import { Check, ShieldCheck, Sparkles, Star, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingProps {
  onRegister: (plan: string) => void;
}

const Pricing: React.FC<PricingProps> = ({ onRegister }) => {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden scroll-mt-24">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 tracking-tight">{t.pricing.title}</h2>
          <p className="text-lg text-gray-600">{t.pricing.subtitle}</p>
        </div>

        {/* Free Plan Banner */}
        <div className="max-w-xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="bg-brand-100 p-3 rounded-xl text-brand-600">
                      <Gift size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-900">{t.pricing.freeTierTitle}</h3>
                      <p className="text-sm text-gray-600">{t.pricing.freeTierDesc}</p>
                  </div>
              </div>
              <button 
                 onClick={() => onRegister('starter')}
                 className="whitespace-nowrap bg-white text-gray-900 border border-gray-200 hover:border-brand-500 hover:text-brand-600 font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm"
              >
                 {t.header.cta}
              </button>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          
          {/* Plan: Monthly (Was Starter in structure, now Monthly) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col hover:border-gray-300 transition-colors lg:mt-8 hover:shadow-lg">
            <h3 className="text-lg font-bold text-gray-900">{t.pricing.plans.monthly.title}</h3>
            <div className="mt-4 mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">{t.pricing.plans.monthly.price}</span>
              <span className="text-gray-500 text-sm">{t.pricing.plans.monthly.period}</span>
            </div>
            <p className="text-gray-500 mb-6 text-sm">{t.pricing.plans.monthly.description}</p>
            <p className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wide">{t.pricing.plans.monthly.billingInfo}</p>
            
            <ul className="space-y-4 mb-8 flex-grow">
              {t.pricing.plans.monthly.features.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <Check className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onRegister('monthly')}
              className="block w-full text-center bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm"
            >
              {t.pricing.plans.monthly.btnText}
            </button>
          </div>

          {/* Plan: Annual (Highlighted) */}
          <div className="bg-brand-950 rounded-3xl border border-brand-800 p-8 flex flex-col relative shadow-2xl shadow-brand-900/20 transform lg:scale-105 z-10 ring-1 ring-brand-700/50">
            {/* Badge Highlight */}
            <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                <div className="bg-gradient-to-r from-accent-500 to-brand-400 text-brand-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-brand-950 shadow-lg flex items-center gap-1.5">
                   <Star size={12} fill="currentColor" />
                   {t.pricing.plans.annual.highlight}
                </div>
            </div>

            <div className="flex justify-between items-start mt-2">
                <div>
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       {t.pricing.plans.annual.title}
                       <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">{t.pricing.plans.annual.savings}</span>
                   </h3>
                   <p className="text-brand-200 text-sm mt-1 opacity-90">{t.pricing.plans.annual.description}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    <Sparkles className="text-accent-400" size={20} />
                </div>
            </div>

            <div className="mt-6 mb-2 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-white tracking-tight">{t.pricing.plans.annual.price}</span>
              <span className="text-brand-200 text-sm font-medium">{t.pricing.plans.annual.period}</span>
            </div>
            <p className="text-xs font-medium text-brand-300 mb-8 uppercase tracking-wide">{t.pricing.plans.annual.billingInfo}</p>
            
            <div className="h-px bg-gradient-to-r from-transparent via-brand-800 to-transparent mb-8"></div>

            <ul className="space-y-4 mb-8 flex-grow">
               {t.pricing.plans.annual.features.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-100 text-sm">
                  <div className="bg-brand-600 rounded-full p-0.5 text-white shadow-sm mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onRegister('annual')}
              className="block w-full text-center bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/20 text-sm hover:-translate-y-0.5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative">{t.pricing.plans.annual.btnText}</span>
            </button>
          </div>

          {/* Plan: Quarterly */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col hover:border-brand-300 hover:shadow-lg transition-all lg:mt-8 group">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{t.pricing.plans.quarterly.title}</h3>
            <div className="mt-4 mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">{t.pricing.plans.quarterly.price}</span>
              <span className="text-gray-500 text-sm">{t.pricing.plans.quarterly.period}</span>
            </div>
            <p className="text-gray-500 mb-6 text-sm">{t.pricing.plans.quarterly.description}</p>
            <p className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wide">{t.pricing.plans.quarterly.billingInfo}</p>
            
            <ul className="space-y-4 mb-8 flex-grow">
              {t.pricing.plans.quarterly.features.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <Check className="w-5 h-5 text-brand-500 shrink-0" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onRegister('quarterly')}
              className="block w-full text-center bg-white border-2 border-gray-100 hover:border-brand-500 hover:text-brand-600 text-gray-700 font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              {t.pricing.plans.quarterly.btnText}
            </button>
          </div>

        </div>

        <div className="mt-16 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="inline-flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <ShieldCheck size={16} className="text-brand-500" />
                <p>{t.pricing.secure}</p>
            </div>
        </div>

      </div>
    </section>
  );
};

export default Pricing;