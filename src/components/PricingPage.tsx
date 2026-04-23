import React, { useState } from 'react';
import { 
  Check, 
  Leaf, 
  Sprout, 
  Wind, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  HelpCircle, 
  Users, 
  MessageSquare, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Heart,
  Sun,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { APP_PLANS, PlanDefinition } from '../lib/billing/plans';
import { billingService } from '../services/billingService';
import PurchaseConfirmModal from './commerce/PurchaseConfirmModal';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, appUser } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Billing state
  const [selectedPlan, setSelectedPlan] = useState<PlanDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePlanClick = (plan: PlanDefinition) => {
    if (!currentUser) {
      navigate('/login'); // Navigate to login if not authenticated
      return;
    }

    if (appUser?.plan === plan.plan) {
      // If already on this plan, we might want to show "Manage" or similar
      handleManageBilling();
      return;
    }

    setSelectedPlan(plan);
    setIsModalOpen(true);
    setError(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan || !currentUser) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { url } = await billingService.createCheckoutSession({
        productKey: selectedPlan.plan as any
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    if (!appUser?.stripeCustomerId) {
      // If they are on a plan but we don't have customerId, something is out of sync
      // or it was a dev-manually set plan.
      alert("Customer portal is only available for subscription members.");
      return;
    }

    try {
      const { url } = await billingService.createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Failed to open billing portal.");
    }
  };

  const renderCTA = (planKey: string) => {
    const planDef = APP_PLANS[planKey];
    const isCurrent = appUser?.plan === planDef.plan;
    
    if (isCurrent) {
      return (
        <button 
          onClick={handleManageBilling}
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
        >
          <CreditCard size={18} />
          {t('billing.managePlan')}
        </button>
      );
    }

    const isSupporterToPro = planDef.plan === 'pro' && appUser?.plan === 'supporter';

    return (
      <button 
        onClick={() => handlePlanClick(planDef)}
        disabled={isProcessing}
        className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2
          ${planDef.plan === 'pro' 
            ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-900/40' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'}
        `}
      >
        {isSupporterToPro ? t('billing.upgrade') : (planDef.plan === 'pro' ? t('pricing.startPro') : t('pricing.becomeSupporter'))}
        <ArrowRight size={18} />
      </button>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-[#FCFDFB] min-h-screen font-sans text-slate-800 pb-24">
      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-full w-full z-0 pointer-events-none opacity-[0.03]">
          <img 
            src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=2000" 
            alt="Nature Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none">
          <div className="absolute top-0 left-10 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-20 right-10 w-96 h-96 bg-sky-50 rounded-full blur-3xl opacity-60"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-8"
          >
            <Sparkles size={14} />
            <span>{t('pricing.badge')}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.15]"
          >
            {t('pricing.heroTitle')}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            {t('pricing.heroSub')}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button className="px-10 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px]">
              {t('pricing.ctaBtn')}
            </button>
            <a href="#plans" className="px-10 py-4.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 min-w-[200px]">
              {t('pricing.compareBtn')}
              <ChevronDown size={18} className="animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Three Plans Cards */}
      <section id="plans" className="py-16 px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Free Plan */}
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all duration-500 relative group">
            <div className="mb-8">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2">
                {t('pricing.plan.freeShort')}
              </span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                  <Leaf size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t('pricing.plan.freeTitle')}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed min-h-[3rem]">
                {t('pricing.plan.freeDesc')}
              </p>
            </div>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold text-slate-900">¥0</span>
              <span className="text-slate-400 font-medium">{t('pricing.perMonth')}</span>
            </div>

            <div className="flex-grow space-y-4 mb-10">
              {[
                'pricing.feature.postIdea',
                'pricing.feature.postSapling',
                'pricing.feature.comments',
                'pricing.feature.basicProfile'
              ].map((key, i) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="mt-1 text-emerald-500/40 bg-emerald-50 rounded-full p-0.5"><Check size={12} /></div>
                  <span className="text-sm text-slate-600 font-medium">{t(key)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-center text-[11px] text-slate-400 font-bold mb-4">
                {t('pricing.plan.freeNote')}
              </p>
              <button className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all">
                {t('pricing.ctaBtn')}
              </button>
            </div>
          </motion.div>

          {/* Supporter Plan */}
          <motion.div variants={itemVariants} className="bg-white rounded-[40px] p-8 border-2 border-emerald-100 shadow-2xl shadow-emerald-50 flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-32 opacity-[0.05] pointer-events-none -z-10">
              <img 
                src="https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?auto=format&fit=crop&q=80&w=500" 
                alt="Sprout pattern"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute top-6 right-8">
              <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                {t('pricing.plan.supporterTag')}
              </span>
            </div>
            
            <div className="mb-8">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] block mb-2">
                {t('pricing.plan.supporterShort')}
              </span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Sprout size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t('pricing.plan.supporterTitle')}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed min-h-[3rem]">
                {t('pricing.plan.supporterDesc')}
              </p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold text-slate-900">{APP_PLANS.supporter_monthly.priceLabel}</span>
              <span className="text-slate-400 font-medium">{t('pricing.perMonth')}</span>
            </div>

            <div className="flex-grow space-y-4 mb-10">
              {[
                'pricing.feature.devLog',
                'pricing.feature.aiSummarize',
                'pricing.feature.boost',
                'pricing.feature.greenhouseAccess'
              ].map((key, i) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="mt-1 text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-full p-0.5"><Check size={12} /></div>
                  <span className="text-sm text-slate-700 font-semibold">{t(key)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-center text-[11px] text-emerald-500 font-bold mb-4">
                {t('pricing.plan.supporterNote')}
              </p>
              {renderCTA('supporter_monthly')}
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-[40px] p-8 border border-slate-800 shadow-2xl flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-32 opacity-[0.1] pointer-events-none -z-10">
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=500" 
                alt="Pro pattern"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute top-6 right-8">
              <span className="px-3 py-1 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                {t('pricing.plan.proTag')}
              </span>
            </div>

            <div className="mb-8">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-[0.2em] block mb-2">
                {t('pricing.plan.proShort')}
              </span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sky-400/10 rounded-2xl flex items-center justify-center text-sky-400 group-hover:rotate-12 transition-transform">
                  <Wind size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">{t('pricing.plan.proTitle')}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed min-h-[3rem]">
                {t('pricing.plan.proDesc')}
              </p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold text-white">{APP_PLANS.pro_monthly.priceLabel}</span>
              <span className="text-slate-500 font-medium">{t('pricing.perMonth')}</span>
            </div>

            <div className="flex-grow space-y-4 mb-10">
              {[
                'pricing.feature.unlimited',
                'pricing.feature.report',
                'pricing.feature.lightConsult',
                'pricing.feature.testerBoost'
              ].map((key, i) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="mt-1 text-sky-400 bg-sky-400/10 rounded-full p-0.5"><Check size={12} /></div>
                  <span className="text-sm text-slate-200 font-semibold">{t(key)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-center text-[11px] text-sky-400 font-bold mb-4">
                {t('pricing.plan.proNote')}
              </p>
              {renderCTA('pro_monthly')}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. Recommended For Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('pricing.whoIsItFor')}</h2>
            <div className="w-12 h-1 bg-emerald-100 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { plan: 'pricing.plan.free', who: 'pricing.whoFree', icon: <Leaf className="text-slate-300" /> },
              { plan: 'pricing.plan.supporter', who: 'pricing.whoSupporter', icon: <Sprout className="text-emerald-500" /> },
              { plan: 'pricing.plan.pro', who: 'pricing.whoPro', icon: <Wind className="text-sky-400" /> }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-2xl">
                <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t(item.plan)}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{t(item.who)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Member Salon (育成スペース) */}
      <section className="py-24 px-6 bg-emerald-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('pricing.salonTitle')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">{t('pricing.salonDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-emerald-100 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Supporter</div>
                  <h3 className="text-lg font-bold text-slate-900">{t('pricing.salonSupporterSub')}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed min-h-[3rem]">
                {t('pricing.salonSupporterDesc')}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold border-t border-slate-50 pt-4">
                <ShieldCheck size={14} className="text-emerald-400" />
                閲覧専用 / Read Only
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-emerald-100 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Pro</div>
                  <h3 className="text-lg font-bold text-slate-900">{t('pricing.salonProSub')}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed min-h-[3rem]">
                {t('pricing.salonProDesc')}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold border-t border-slate-50 pt-4">
                <Zap size={14} />
                投稿・相談可能 / Posting Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Boost Feature (光を当てる) */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="text-center mb-16 relative z-10">
            <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6">
              <Sun size={32} className="animate-spin-slow" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('pricing.boostTitle')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">{t('pricing.boostDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-10">
              <div className="flex gap-5">
                <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{t('pricing.boostSupporterSub')}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t('pricing.boostSupporterDesc')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-5">
                <div className="shrink-0 w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{t('pricing.boostProSub')}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t('pricing.boostProDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 relative md:translate-x-6">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">単発での利用も可能です / Top-up Menu</div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{t('pricing.oneTimeBoost')}</span>
                <span className="text-emerald-600 font-bold">¥100</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{t('pricing.oneTimeReport')}</span>
                <span className="text-emerald-600 font-bold">¥300</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{t('pricing.oneTimeTesters')}</span>
                <span className="text-emerald-600 font-bold">¥300</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mb-6">
              <HelpCircle size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('pricing.faqTitle')}</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
              { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
              { q: t('pricing.faq.q3'), a: t('pricing.faq.a3') },
              { q: t('pricing.faq.q4'), a: t('pricing.faq.a4') },
              { q: '購入前に販売条件を確認できますか？', a: 'はい、「特定商取引法に基づく表記」からご確認いただけます。ページ下部のリンクよりアクセスしてください。', link: '/commerce' }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className={`w-full p-6 text-left flex items-center justify-between transition-colors ${openFaq === idx ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}
                >
                  <span className="font-bold text-sm text-slate-700 pr-8">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} className="text-slate-300 shrink-0" /> : <ChevronDown size={18} className="text-slate-300 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 text-sm text-slate-500 leading-relaxed font-medium">
                      {faq.a}
                      {faq.link && (
                        <div className="mt-4">
                          <a href={faq.link} className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">
                            {t('footer.commerce')} <ArrowRight size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-sm">
            <Heart size={36} fill="currentColor" stroke="none" className="animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
            {t('pricing.ctaTitle')}<br />
            {t('pricing.ctaSubtitle')}
          </h2>
          <p className="text-slate-500 mb-12 leading-relaxed transition-all hover:text-slate-600 cursor-default">
            {t('pricing.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-emerald-200 transition-all active:scale-95">
              {t('pricing.ctaBtn')}
            </button>
            <button className="px-12 py-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-[24px] font-bold text-lg transition-all active:scale-95">
              {t('nav.submit')}
            </button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-slate-300">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              {t('pricing.initialCost')}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              {t('pricing.cancelAnytime')}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Decal */}
      <footer className="pt-12 text-center text-slate-200 pointer-events-none">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sprout size={18} />
          <span className="font-serif italic text-base tracking-widest text-emerald-600" translate="no">App Gardenium</span>
        </div>
        <p className="text-[9px] uppercase tracking-[0.3em] font-medium opacity-50">
          {t('pricing.footerNote')}
        </p>
      </footer>

      {/* Purchase Modal */}
      <PurchaseConfirmModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPurchase}
        plan={selectedPlan}
        isProcessing={isProcessing}
      />
      
      {/* Error Toast/Notice could be added here */}
    </div>
  );
};

export default PricingPage;
