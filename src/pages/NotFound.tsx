import { Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 bg-emerald-50 rounded-[28px] mx-auto flex items-center justify-center mb-6 transform -rotate-6">
          <Leaf className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-serif text-text-dark mb-4">404</h1>
        <p className="text-text-muted mb-8">
          {language === 'ja' 
            ? 'お探しのページは見つかりませんでした。移動したか、削除された可能性があります。'
            : 'The page you are looking for could not be found. It might have been moved or deleted.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="py-3 px-8 bg-primary text-white rounded-full font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          {language === 'ja' ? 'ホームに戻る' : 'Go back home'}
        </button>
      </div>
    </div>
  );
}
