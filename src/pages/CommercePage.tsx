import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export default function CommercePage() {
  const { t } = useLanguage();
  const [showSensitive, setShowSensitive] = useState(false);

  // SEO: 検索エンジンにインデックスされないように設定
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20 text-slate-500 font-sans leading-tight bg-slate-50/30 min-h-screen border-x border-slate-100">
      {/* ページタイトル - 控えめに */}
      <div className="mb-10 text-slate-400">
        <h1 className="text-xl font-medium mb-2 tracking-tight">
          特定商取引法に基づく表記 / Legal Disclosure
        </h1>
        <p className="text-[10px] uppercase tracking-tighter opacity-70">
          Act on Specified Commercial Transactions
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 shadow-sm">
        <div className="mb-8 p-4 bg-slate-50 rounded border border-slate-100 flex items-start gap-3">
          <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            このページは日本の法律に基づき、サービス提供者の情報を開示するものです。プライバシー保護のため、個人を特定する情報はデフォルトで非表示になっています。詳細を確認するには「開示する」を選択してください。<br />
            This page discloses provider information as required by Japanese law. For privacy, sensitive information is hidden by default. Click "Show Details" to view.
          </p>
        </div>

        {/* 表記内容リスト - 全体的にフォントサイズを下げ、無機質なデザインに */}
        <div className="space-y-8 text-[13px]">
          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              販売事業者 / Seller
            </h2>
            <div className="text-slate-600">
              <p>madowaku / App Gardenium 運営</p>
              <p className="text-[11px] opacity-60">madowaku / App Gardenium Operator</p>
            </div>
          </section>

          <div className="bg-slate-50/50 rounded-md p-4 border border-dashed border-slate-200">
            <button 
              onClick={() => setShowSensitive(!showSensitive)}
              className="flex items-center gap-2 text-primary text-[11px] font-semibold hover:underline transition-all"
            >
              {showSensitive ? (
                <>個人情報を隠す / Hide Sensitive Info <ChevronUp size={14} /></>
              ) : (
                <>個人情報を表示する / Show Personal Details <ChevronDown size={14} /></>
              )}
            </button>

            {showSensitive && (
              <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <section>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    運営責任者 / Responsible Person
                  </h2>
                  <p className="text-slate-800 font-medium">相良 洋紀 / Hiroki Sagara</p>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    所在地 / Address
                  </h2>
                  <div className="text-slate-700">
                    <p>広島県東広島市高屋町造賀6561-5</p>
                    <p className="text-[11px] opacity-70">6561-5 Takayacho Zoka, Higashihiroshima, Hiroshima, Japan</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    電話番号 / Phone Number
                  </h2>
                  <p className="text-slate-700">080-6444-0696</p>
                </section>
              </div>
            )}
          </div>

          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              メールアドレス / Contact
            </h2>
            <p>
              <a 
                href="mailto:raindrum909@gmail.com" 
                className="text-slate-400 underline hover:text-slate-600 transition-colors"
              >
                raindrum909@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              販売価格 / Price
            </h2>
            <div className="text-slate-600">
              <p>各購入ページに表示（税込）</p>
              <p className="text-[11px] opacity-60">Displayed on each page (incl. tax)</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              支払時期・方法 / Payment
            </h2>
            <div className="text-slate-600 text-[11px]">
              <p>時期：購入手続時に確定（確定時に決済）</p>
              <p>方法：クレジットカード等（購入時に表示）</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              提供時期 / Delivery
            </h2>
            <p className="text-slate-600 text-[11px]">
              決済完了後すぐ、またはシステム状況により数分以内。<br />
              Immediately or within minutes of payment.
            </p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
              返金・キャンセル / Refunds
            </h2>
            <p className="text-slate-600 text-[11px]">
              商品の性質上、返品・返金は不可。<br />
              No returns/refunds due to digital nature.
            </p>
          </section>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[9px] text-slate-300">
          Last Updated: 2026-04-22<br />
          &copy; App Gardenium Legal Disclosure.
        </p>
      </div>
    </div>
  );
}
