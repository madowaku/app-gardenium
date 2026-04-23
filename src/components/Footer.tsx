import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-100 bg-white py-12 px-6 mt-16 selection:bg-emerald-50 selection:text-emerald-700">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
          {/* 左側: ブランドとタグライン */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mr-3">
                <Leaf className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-bold text-slate-800 text-xl tracking-tight" translate="no">App Gardenium</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
              {t('footer.tagline1')}<br />
              {t('footer.tagline2')}
            </p>
          </div>

          {/* 右側: リンク */}
          <nav className="flex flex-col sm:flex-row gap-6 sm:gap-10">
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('footer.support')}</p>
              <ul className="space-y-3">
                <li>
                  <Link to="/terms" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/commerce" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
                    {t('footer.commerce')}
                  </Link>
                </li>
                <li>
                  <a href="mailto:raindrum909@gmail.com" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5 group">
                    <Mail size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    {t('footer.contact')}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* 最下段: 開発者情報とコピーライト */}
        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">{t('footer.creator')}</span>
              <span className="text-slate-500">madowaku</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Email</span>
              <a href="mailto:raindrum909@gmail.com" className="text-slate-500 hover:text-emerald-600 transition-colors underline decoration-slate-200 underline-offset-4">
                raindrum909@gmail.com
              </a>
            </div>
          </div>
          
          <div className="text-slate-400 italic" translate="no">
            © 2026 App Gardenium. {t('footer.builtBy').replace('{name}', 'madowaku')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
