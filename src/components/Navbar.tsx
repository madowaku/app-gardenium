import { Leaf, Globe } from 'lucide-react';
import { PageType } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

interface NavbarProps {
  navigate: (page: PageType) => void;
  currentPage: PageType;
}

export default function Navbar({ navigate, currentPage }: NavbarProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const { currentUser } = useAuth();

  return (
    <nav className="bg-bg-main/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border-color/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20">
          <div className="flex items-center cursor-pointer shrink-0" onClick={() => navigate('home')} translate="no">
            <img src="/icon192.png" alt="App Gardenium" className="h-6 w-6 sm:h-8 sm:w-8 mr-1 sm:mr-2 object-contain" />
            <span className="font-sans font-bold text-base xs:text-lg sm:text-2xl tracking-tight text-primary leading-none">App</span>
            <span className="font-sans font-semibold text-base xs:text-lg sm:text-2xl tracking-tight text-accent ml-0.5 sm:ml-1.5 leading-none whitespace-nowrap">Gardenium</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => navigate('home')}
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-primary' : 'text-text-muted hover:text-text-dark'}`}
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => navigate('explore')}
              className={`text-sm font-medium transition-colors ${currentPage === 'explore' ? 'text-primary' : 'text-text-muted hover:text-text-dark'}`}
            >
              {t('nav.explore')}
            </button>
            <button 
              onClick={() => navigate('salon')}
              className={`text-sm font-medium transition-colors ${currentPage === 'salon' ? 'text-primary' : 'text-text-muted hover:text-text-dark'}`}
            >
              {t('nav.salon')}
            </button>
            <button 
              onClick={() => navigate('pricing')}
              className={`text-sm font-medium transition-colors ${currentPage === 'pricing' ? 'text-primary' : 'text-text-muted hover:text-text-dark'}`}
            >
              {t('nav.pricing')}
            </button>
            <button 
              onClick={() => navigate('submit')}
              className="text-sm font-medium bg-primary text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5"
            >
              {t('nav.submit')}
            </button>
            {!currentUser ? (
              <button 
                onClick={() => navigate('login')}
                className={`text-sm font-medium transition-colors ${currentPage === 'login' ? 'text-primary' : 'text-text-muted hover:text-text-dark'}`}
              >
                {t('nav.login')}
              </button>
            ) : (
              <>
                <NotificationsDropdown navigate={navigate} />
                <button 
                  onClick={() => navigate('profile')}
                  className="h-8 w-8 rounded-full border border-border-color bg-bg-main flex items-center justify-center text-text-muted hover:opacity-80 transition-opacity overflow-hidden"
                >
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </button>
              </>
            )}
            <div className="h-4 w-px bg-border-color mx-2"></div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-dark transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-border-color"
            >
              <Globe size={14} />
              {t('nav.language')}
            </button>
          </div>

          <div className="flex items-center md:hidden gap-0.5 xs:gap-1 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="text-text-muted p-1.5 xs:p-2 hover:bg-slate-50 rounded-full transition-colors"
              aria-label={t('nav.language')}
            >
              <Globe size={18} />
            </button>
            <button 
              onClick={() => navigate('submit')}
              className="text-xs sm:text-sm font-medium bg-primary text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center min-w-[36px] sm:min-w-[40px]"
            >
              <span className="hidden sm:inline">{t('nav.submit')}</span>
              <Leaf size={14} className="sm:hidden" />
            </button>
            {!currentUser ? (
              <button 
                onClick={() => navigate('login')}
                className="text-xs sm:text-sm font-medium text-text-muted hover:text-text-dark px-1"
              >
                {t('nav.login')}
              </button>
            ) : (
              <>
                <NotificationsDropdown navigate={navigate} />
                <button onClick={() => navigate('profile')} className="text-text-muted hover:opacity-80 transition-opacity p-1">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-border-color bg-bg-main flex items-center justify-center overflow-hidden">
                     {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-bold text-primary">{currentUser.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
