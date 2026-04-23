import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Home, CreditCard, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const BillingCancelPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FCFDFB] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl text-center"
      >
        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto mb-8">
          <Wind size={40} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 font-serif italic">
          {t('billing.cancelTitle')}
        </h1>
        
        <p className="text-slate-500 leading-relaxed mb-10 font-medium">
          {t('billing.cancelDesc')}
        </p>

        <div className="space-y-4">
          <Link 
            to="/pricing" 
            className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <CreditCard size={18} />
            {t('billing.backToPricing')}
          </Link>
          
          <Link 
            to="/" 
            className="w-full py-4.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Home size={18} />
            {t('billing.action.goHome')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default BillingCancelPage;
