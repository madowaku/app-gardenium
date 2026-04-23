import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CreditCard, AlertCircle, Loader2, Check, Info, Leaf, Sparkles } from 'lucide-react';
import { ProductDefinition } from '../../types/commerce';
import { PlanDefinition } from '../../lib/billing/plans';
import { useLanguage } from '../../contexts/LanguageContext';

interface PurchaseConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product?: ProductDefinition | null;
  plan?: PlanDefinition | null;
  isProcessing?: boolean;
}

export default function PurchaseConfirmModal({
  open,
  onClose,
  onConfirm,
  product,
  plan,
  isProcessing = false
}: PurchaseConfirmModalProps) {
  const { t } = useLanguage();
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!product && !plan) return null;

  const planKey = plan?.plan as 'supporter' | 'pro';
  
  // Supporter benefits
  const supporterFeatures = [
    'plan.supporter.f1',
    'plan.supporter.f2',
    'plan.supporter.f3',
    'plan.supporter.f4',
    'plan.supporter.f5',
  ];

  // Pro benefits
  const proFeatures = [
    'plan.pro.f1',
    'plan.pro.f2',
    'plan.pro.f3',
    'plan.pro.f4',
    'plan.pro.f5',
    'plan.pro.f6',
  ];

  const features = planKey === 'pro' ? proFeatures : (planKey === 'supporter' ? supporterFeatures : []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-start relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400"></div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-2 block">
                  {t('billing.confirm.header')}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  {plan ? (
                    <>
                      {planKey === 'pro' ? <Sparkles className="text-sky-400" size={24} /> : <Leaf className="text-emerald-500" size={24} />}
                      {t(`plan.${planKey}.confirmTitle`)}
                    </>
                  ) : t('commerce.confirmPurchase')}
                </h2>
              </div>
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="px-8 py-4 space-y-6 overflow-y-auto">
              {/* Plan Intro */}
              {plan && (
                <p className="text-slate-600 leading-relaxed font-medium">
                  {t(`plan.${planKey}.confirmSub`)}
                </p>
              )}

              {/* Price Card */}
              <div className={`rounded-3xl p-6 border ${planKey === 'pro' ? 'bg-sky-50/50 border-sky-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('billing.billingCycle')}</span>
                    <span className={`text-2xl font-bold ${planKey === 'pro' ? 'text-sky-600' : 'text-emerald-600'}`}>
                      {plan ? t(`plan.${planKey}.price`) : product?.priceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium opacity-80">
                    {plan ? t(`plan.${planKey}.cycle`) : t('commerce.instantFulfillment')}
                  </p>
                </div>
              </div>

              {/* Features List */}
              {plan && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    {t('billing.unlockedFeatures')}
                  </h3>
                  <ul className="grid grid-cols-1 gap-3">
                    {features.map((fKey, i) => (
                      <motion.li 
                        key={fKey}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                        className="flex items-start gap-3 text-sm text-slate-600 font-medium"
                      >
                        <div className={`mt-0.5 rounded-full p-0.5 ${planKey === 'pro' ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        {t(fKey)}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Product Info (Direct Purchase) */}
              {!plan && product && (
                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">提供時期 / Delivery</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{product.deliveryTiming}</p>
                  </div>
                </div>
              )}

              {/* Legal & Notes */}
              <div className="space-y-4 pt-2">
                {plan && (
                  <div className="flex gap-3 p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50">
                    <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {t(`plan.${planKey}.note`)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 px-1">
                  <div className="flex-shrink-0 mt-1 text-slate-300">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {t('billing.confirm.legalNote')}
                    </p>
                    <Link
                      to="/commerce"
                      target="_blank"
                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1.5 group w-fit bg-emerald-50 px-3 py-1.5 rounded-full transition-colors hover:bg-emerald-100"
                    >
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>{t('billing.viewLegal')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-3">
              <button
                disabled={isProcessing}
                onClick={onConfirm}
                className={`w-full py-4.5 rounded-2xl text-white font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 group active:scale-[0.97]
                  ${isProcessing ? 'bg-slate-300 cursor-not-allowed shadow-none' : 
                    planKey === 'pro' ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('billing.processing')}</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    <span>{plan ? t('billing.proceedToCheckout') : t('commerce.proceedToPurchase')}</span>
                  </>
                )}
              </button>
              
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-transparent text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  {t('profile.cancel')}
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 font-semibold px-4">
                {t('billing.reflectingNotice')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
