import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, MessageSquareText, Lightbulb, Target, Sparkles, Info } from 'lucide-react';
import { AiReport } from '../../types/commerce';
import { useLanguage } from '../../contexts/LanguageContext';

interface AiReportCardProps {
  report: AiReport;
}

export const AiReportCard: React.FC<AiReportCardProps> = ({ report }) => {
  const { t, language } = useLanguage();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-emerald-50 px-6 py-4 flex items-center justify-between border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-emerald-900">{t('report.title')}</h3>
        </div>
        <span className="text-[10px] bg-white/60 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
          {t('report.generatedBy')}
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Summary */}
        <section>
          <div className="flex items-start gap-3 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <MessageSquareText size={16} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">{t('report.summaryLabel')}</h4>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed pl-9">
            {report.summary}
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Common Requests */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Lightbulb size={16} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mt-0.5">{t('report.commonRequestsLabel')}</h4>
            </div>
            <ul className="space-y-2.5 pl-9">
              {report.commonRequests.map((req, i) => (
                <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 mt-1.5 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </section>

          {/* Concerns */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Target size={16} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mt-0.5">{t('report.concernsLabel')}</h4>
            </div>
            <ul className="space-y-2.5 pl-9">
              {report.concerns.map((con, i) => (
                <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-200 mt-1.5 flex-shrink-0" />
                  {con}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Next Actions */}
        <section className="bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BarChart3 size={16} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">{t('report.nextActionsLabel')}</h4>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pl-9 sm:pl-0">
            {report.nextActions.map((action, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
                <div className="text-text-muted mb-1 font-bold opacity-50">#0{i+1}</div>
                {action}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {t('report.analyzedAt')}: {new Date(report.createdAt).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
        </span>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Info size={12} />
          <span>{t('report.onlyLatestDesc')}</span>
        </div>
      </div>
    </motion.div>
  );
}
