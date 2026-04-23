import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Sprout, 
  ArrowRight, 
  Home, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  User,
  RefreshCw,
  Wind
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const BillingSuccessPage: React.FC = () => {
  const { t } = useLanguage();
  const { appUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [showReflecting, setShowReflecting] = useState(false);

  // If the Firestore sync is slow, we might still see 'free'
  const effectivePlan = appUser?.plan || 'free';
  
  useEffect(() => {
    // Show a small notice if the plan is still 'free' after success
    if (effectivePlan === 'free') {
      const timer = setTimeout(() => setShowReflecting(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowReflecting(false);
    }
  }, [effectivePlan]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getFeatures = () => {
    if (effectivePlan === 'pro') {
      return [
        { icon: <MessageSquare size={18} />, label: t('billing.feature.postSalon') },
        { icon: <BarChart3 size={18} />, label: t('billing.feature.aiReport') },
        { icon: <Zap size={18} />, label: t('billing.feature.aiOrganize') },
        { icon: <Sparkles size={18} />, label: t('billing.feature.boostApply') }
      ];
    }
    return [
      { icon: <Sprout size={18} />, label: t('billing.feature.readSalon') },
      { icon: <Zap size={18} />, label: t('billing.feature.aiSum') },
      { icon: <Wind size={18} />, label: t('billing.feature.logWide') },
      { icon: <ShieldCheck size={18} />, label: t('billing.feature.badgeSupporter') }
    ];
  };

  const getSteps = () => {
    if (effectivePlan === 'pro') {
      return [
        { title: t('billing.step.pro1.title'), desc: t('billing.step.pro1.desc') },
        { title: t('billing.step.pro2.title'), desc: t('billing.step.pro2.desc') },
        { title: t('billing.step.pro3.title'), desc: t('billing.step.pro3.desc') }
      ];
    }
    return [
      { title: t('billing.step.supporter1.title'), desc: t('billing.step.supporter1.desc') },
      { title: t('billing.step.supporter2.title'), desc: t('billing.step.supporter2.desc') },
      { title: t('billing.step.supporter3.title'), desc: t('billing.step.supporter3.desc') }
    ];
  };

  return (
    <div className="bg-[#FCFDFB] min-h-screen py-16 px-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto"
      >
        {/* Success Hero */}
        <motion.section variants={itemVariants} className="text-center mb-16">
          <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-sm">
            <CheckCircle2 size={40} className="animate-in zoom-in duration-500" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-serif italic">
            {t('billing.successTitle')}
          </h1>
          
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            {effectivePlan === 'pro' ? t('billing.successSubPro') : t('billing.successSubSupporter')}
          </p>

          <AnimatePresence>
            {showReflecting && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100"
              >
                <RefreshCw size={12} className="animate-spin" />
                {t('billing.reflectingNotice')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Features Unlocked */}
          <motion.section variants={itemVariants}>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              {t('billing.unlockedFeatures')}
            </h2>
            <div className="space-y-4">
              {getFeatures().map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                    {f.icon}
                  </div>
                  <p className="text-sm font-bold text-slate-700">{f.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Onboarding Steps */}
          <motion.section variants={itemVariants}>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
              {effectivePlan === 'pro' ? t('billing.startHerePro') : t('billing.startHere')}
            </h2>
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              {getSteps().map((s, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className="shrink-0 w-10 h-10 bg-white border-2 border-slate-50 rounded-full flex items-center justify-center text-sm font-black text-slate-300 z-10 transition-colors hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Final Actions */}
        <motion.section variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 border-t border-slate-100">
          <Link 
            to="/salon" 
            className="px-10 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[220px]"
          >
            {effectivePlan === 'pro' ? (
              <><Zap size={18} /> {t('billing.action.postProgress')}</>
            ) : (
              <><Sprout size={18} /> {t('billing.action.viewGreenhouse')}</>
            )}
            <ArrowRight size={18} />
          </Link>
          
          <div className="flex gap-2">
            <Link 
              to="/mypage" 
              className="p-4.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              title={t('billing.action.viewProfile')}
            >
              <User size={18} />
            </Link>
            
            <Link 
              to="/" 
              className="px-8 py-4.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} />
              {t('billing.action.goHome')}
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default BillingSuccessPage;
