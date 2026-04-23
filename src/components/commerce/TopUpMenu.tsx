import React from 'react';
import { motion } from 'motion/react';
import { Zap, FileText, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTopUpDisplayPrice } from '../../lib/commerce/pricingConfig';

interface TopUpMenuProps {
  topUps: {
    boostSupportCount?: number;
    extraActivityReportsRemaining?: number;
    extraTesterRecruitmentsRemaining?: number;
  };
  onPurchase: (productKey: string) => void;
  isLoading?: boolean;
}

export default function TopUpMenu({ topUps, onPurchase, isLoading }: TopUpMenuProps) {
  const { t, language } = useLanguage();

  const menuItems = [
    {
      key: 'boost',
      id: 'boost_support',
      icon: <Zap size={24} fill="currentColor" />,
      colorClass: 'amber',
      count: topUps?.boostSupportCount || 0,
      statusKey: 'membership.topup.boost.status'
    },
    {
      key: 'report',
      id: 'extra_activity_report',
      icon: <FileText size={24} />,
      colorClass: 'emerald',
      count: topUps?.extraActivityReportsRemaining || 0,
      statusKey: 'membership.topup.report.status'
    },
    {
      key: 'tester',
      id: 'extra_tester_recruitment',
      icon: <Users size={24} />,
      colorClass: 'indigo',
      count: topUps?.extraTesterRecruitmentsRemaining || 0,
      statusKey: 'membership.topup.tester.status'
    }
  ];

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-medium text-text-dark mb-2">
          {t('membership.topup.title')}
        </h2>
        <p className="text-text-muted text-sm">
          {t('membership.topup.desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ y: -4 }}
            className={`bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-${item.colorClass}-200 transition-all`}
          >
            <div className={`w-12 h-12 bg-${item.colorClass}-50 rounded-2xl flex items-center justify-center text-${item.colorClass}-500 mb-4 group-hover:bg-${item.colorClass}-100 transition-colors`}>
              {item.icon}
            </div>
            <h4 className="font-bold text-slate-800 mb-1">{t(`membership.topup.${item.key}.title`)}</h4>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">{t(`membership.topup.${item.key}.desc`)}</p>
            
            <div className="mt-auto w-full">
              <div className={`text-[10px] font-bold text-${item.colorClass}-600 mb-2 bg-${item.colorClass}-50 py-1 rounded-full border border-${item.colorClass}-100`}>
                {t(item.statusKey).replace('{count}', String(item.count))}
              </div>
              <button 
                onClick={() => onPurchase(item.id)}
                disabled={isLoading}
                className={`w-full py-2 bg-slate-50 text-slate-700 rounded-xl font-bold text-xs hover:bg-${item.colorClass}-600 hover:text-white transition-all shadow-sm border border-slate-100 disabled:opacity-50`}
              >
                {t(`membership.topup.${item.key}.button`).replace('{price}', getTopUpDisplayPrice(item.id, language))}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
