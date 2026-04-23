import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  CreditCard, 
  ExternalLink, 
  Loader2, 
  Leaf, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Sprout,
  CheckCircle2,
  Trash2,
  Lock,
  Plus,
  Rocket,
  Zap,
  FileText,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { billingService } from '../services/billingService';
import { APP_PLANS } from '../lib/billing/plans';
import { getMembershipUiState } from '../lib/billing/planStatus';
import TopUpMenu from '../components/commerce/TopUpMenu';
import { PageType } from '../App';

interface MembershipPageProps {
  navigate: (page: PageType, id?: string) => void;
}

const MembershipPage: React.FC<MembershipPageProps> = ({ navigate }) => {
  const { t, language } = useLanguage();
  const { currentUser, appUser } = useAuth();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // Fetch detailed membership and top-up status
  React.useEffect(() => {
    const fetchStatus = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/user/membership-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setMembershipStatus(await response.json());
        }
      } catch (err) {
        console.error('Failed to fetch membership status:', err);
      } finally {
        setIsStatusLoading(false);
      }
    };
    fetchStatus();
  }, [currentUser]);

  if (!currentUser || !appUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  const handlePortal = async () => {
    setIsPortalLoading(true);
    setError(null);
    try {
      const { url } = await billingService.createPortalSession();
      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to open management portal.');
      setIsPortalLoading(false);
    }
  };

  const handlePurchase = async (productKey: string) => {
    setError(null);
    try {
      const { url } = await billingService.createCheckoutSession({
        productKey: productKey as any
      });
      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start checkout.');
    }
  };

  const currentPlan = appUser.plan || 'free';
  const uiState = getMembershipUiState(appUser);
  
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'active':
      case 'renewing': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'payment_issue': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'cancel_scheduled': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'canceled':
      case 'expired': return 'text-slate-500 bg-slate-50 border-slate-100';
      case 'pending_activation': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const planInfo = currentPlan === 'free' 
    ? { title: t('pricing.plan.freeTitle'), desc: t('pricing.plan.freeDesc'), color: 'emerald' }
    : currentPlan === 'supporter'
    ? { title: t('pricing.plan.supporterTitle'), desc: t('pricing.plan.supporterDesc'), color: 'emerald' }
    : { title: t('pricing.plan.proTitle'), desc: t('pricing.plan.proDesc'), color: 'sky' };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-text-dark mb-3">
          {t('membership.title')}
        </h1>
        <p className="text-text-muted">
          {t('pricing.badge')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Plan Info */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-[32px] p-8 md:p-10 shadow-sm border border-border-color overflow-hidden relative"
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-${planInfo.color}-400`}></div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 block">
                  {t('membership.currentPlan')}
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                    {planInfo.title}
                  </h2>
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(uiState)}`}>
                    {t(`membership.state.${uiState}.label`)}
                  </div>
                </div>
              </div>
              {currentPlan !== 'free' && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t('membership.startedAt')}
                  </span>
                  <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-300" />
                    {appUser.planStartedAt ? new Date(appUser.planStartedAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-slate-600 leading-relaxed font-medium">
                {planInfo.desc}
              </p>
              
              <div className={`flex gap-3 p-4 rounded-2xl border ${getStatusColor(uiState)} bg-opacity-30`}>
                <div className="mt-0.5">
                  {uiState === 'payment_issue' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold opacity-80 mb-0.5">{t(`membership.state.${uiState}.label`)}</h4>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {t(`membership.state.${uiState}.desc`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
              {uiState === 'payment_issue' && (
                <button 
                  onClick={handlePortal}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95"
                >
                  {t('membership.changePayment')}
                  <ArrowRight size={16} />
                </button>
              )}
              
              {currentPlan === 'free' && (
                <>
                  <button 
                    onClick={() => navigate('pricing')}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    {t('membership.upgradeSupporter')}
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
              
              {(uiState === 'active' || uiState === 'renewing' || uiState === 'cancel_scheduled') && (
                <button 
                  onClick={() => navigate('salon')}
                  className={`flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
                    currentPlan === 'pro' ? 'bg-sky-500 shadow-sky-100 hover:bg-sky-600' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                  }`}
                >
                  {currentPlan === 'pro' ? (
                    <>
                      {t('membership.post')}
                      <Plus size={16} />
                    </>
                  ) : (
                    <>
                      {t('membership.greenhouse')}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}

              {currentPlan === 'supporter' && uiState !== 'cancel_scheduled' && (
                <button 
                  onClick={() => navigate('pricing')}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-sky-600 rounded-2xl font-bold text-sm hover:bg-sky-50 transition-all active:scale-95"
                >
                  {t('membership.upgradePro')}
                  <Sparkles size={16} />
                </button>
              )}

              {uiState === 'pending_activation' && (
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Loader2 size={16} className="animate-spin" />
                  {t('membership.reloadStatus')}
                </button>
              )}

              {(uiState === 'canceled' || uiState === 'expired') && (
                <button 
                  onClick={() => navigate('home')}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                  {t('membership.keepFree')}
                </button>
              )}
            </div>
          </motion.div>

          {/* Top-up Menu Section */}
          <TopUpMenu 
            topUps={membershipStatus?.topUps}
            onPurchase={handlePurchase}
            isLoading={isStatusLoading}
          />

          {/* Perks Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Supporter Benefits */}
            <div className={`p-8 rounded-[32px] border-2 transition-all shadow-sm ${currentPlan === 'supporter' ? 'border-primary bg-primary-light/5' : 'border-border-color bg-white'}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center border border-primary/20">
                  <Leaf className="text-primary" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-medium text-text-dark leading-tight">{t('pricing.plan.supporter')}</h3>
                  <p className="text-text-muted text-sm font-light">{t('pricing.plan.supporterShort')}</p>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-primary" />
                    </div>
                    <span className="text-sm font-light text-text-muted">{t(`plan.supporter.f${i}`)}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === 'supporter' ? (
                <div className="py-3 px-6 bg-primary/10 text-primary font-bold text-center rounded-full text-sm border border-primary/20">
                  {t('billing.currentPlan')}
                </div>
              ) : currentPlan === 'free' ? (
                <button 
                  onClick={() => navigate('pricing')}
                  className="w-full py-4 bg-primary text-white font-bold rounded-full text-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
                >
                  {t('membership.upgradeSupporter')}
                </button>
              ) : null}
            </div>

            {/* Pro Benefits */}
            <div className={`p-8 rounded-[32px] border-2 transition-all shadow-sm ${currentPlan === 'pro' ? 'border-primary bg-primary-light/5' : 'border-border-color bg-white'}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-text-dark text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Rocket size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-medium text-text-dark leading-tight">{t('pricing.plan.pro')}</h3>
                  <p className="text-text-muted text-sm font-light">{t('pricing.plan.proShort')}</p>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-text-dark/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-text-dark" />
                    </div>
                    <span className="text-sm font-light text-text-muted">{t(`plan.pro.f${i}`)}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === 'pro' ? (
                <div className="py-3 px-6 bg-text-dark text-white font-bold text-center rounded-full text-sm shadow-md">
                  {t('billing.currentPlan')}
                </div>
              ) : (
                <button 
                  onClick={() => navigate('pricing')}
                  className="w-full py-4 bg-text-dark text-white font-bold rounded-full text-sm shadow-xl shadow-gray-200 hover:opacity-90 transition-all active:scale-95"
                >
                  {t('membership.upgradePro')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Management Actions */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CreditCard className="text-slate-400" size={20} />
              {t('membership.manage')}
            </h3>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs flex items-start gap-2 border border-red-100">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              {currentPlan === 'free' ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-sm font-medium text-slate-500 italic mb-4">
                    {t('membership.status.free')}
                  </p>
                  <button 
                    onClick={() => navigate('pricing')}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    {t('pricing.ctaBtn')}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    {t('membership.portalDesc')}
                  </p>
                  <button 
                    onClick={handlePortal}
                    disabled={isPortalLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {isPortalLoading ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                    {t('membership.openPortal')}
                  </button>
                  <button 
                    onClick={handlePortal}
                    className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    {t('membership.billingHistory')}
                  </button>
                </>
              )}
            </div>
            
            <p className="mt-8 text-[10px] text-center text-slate-400 leading-relaxed">
              {t('membership.reflectNotice')}
            </p>
          </motion.div>

          <div className="px-6 text-center">
            <p className="text-xs text-slate-400 italic">
              Thank you for being part of Gardenium.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
