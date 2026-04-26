import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Seo from './components/Seo';
import { DEFAULT_LANGUAGE, getPathLanguage, localizePath, stripLanguagePrefix } from './lib/i18nRoutes';
import { useLanguage } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const Explore = lazy(() => import('./pages/Explore'));
const IdeaDetail = lazy(() => import('./pages/IdeaDetail'));
const SubmitIdea = lazy(() => import('./pages/SubmitIdea'));
const TesterCall = lazy(() => import('./pages/TesterCall'));
const NewTesterCall = lazy(() => import('./pages/NewTesterCall'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const SalonPage = lazy(() => import('./components/SalonPage'));
const CommercePage = lazy(() => import('./pages/CommercePage'));
const TermsPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.PrivacyPage })));
const ManageBoosts = lazy(() => import('./pages/ManageBoosts'));
const BillingSuccessPage = lazy(() => import('./pages/billing/BillingSuccessPage'));
const BillingCancelPage = lazy(() => import('./pages/billing/BillingCancelPage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export type PageType = 'home' | 'explore' | 'ideaDetail' | 'submit' | 'testerCall' | 'newTesterCall' | 'profile' | 'login' | 'pricing' | 'terms' | 'privacy' | 'salon' | 'billingSuccess' | 'billingCancel' | 'membership' | 'manageBoosts';

function pageToPath(page: PageType, id?: string) {
  switch (page) {
    case 'home': return '/';
    case 'explore': return '/ideas';
    case 'ideaDetail': return `/ideas/${id ?? ''}`;
    case 'submit': return '/ideas/new';
    case 'testerCall': return `/tester-calls/${id ?? ''}`;
    case 'newTesterCall': return '/tester-calls/new';
    case 'profile': return '/mypage';
    case 'login': return '/login';
    case 'pricing': return '/pricing';
    case 'terms': return '/terms';
    case 'privacy': return '/privacy';
    case 'salon': return '/salon';
    case 'billingSuccess': return '/billing/success';
    case 'billingCancel': return '/billing/cancel';
    case 'membership': return '/membership';
    case 'manageBoosts': return '/admin/boosts';
  }
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-sm font-medium text-text-muted">Loading...</div>
    </div>
  );
}

function IdeaDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getPathLanguage(location.pathname) || DEFAULT_LANGUAGE;
  return <IdeaDetail navigate={(page, newId) => navigate(localizePath(pageToPath(page, newId || id), lang))} ideaId={id || null} />;
}

function TesterCallWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getPathLanguage(location.pathname) || DEFAULT_LANGUAGE;
  return <TesterCall navigate={(page, newId) => navigate(localizePath(pageToPath(page, newId || id), lang))} ideaId={id || null} />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const pathLanguage = getPathLanguage(location.pathname);
  const activeLanguage = pathLanguage || language;
  const currentPath = stripLanguagePrefix(location.pathname);

  useEffect(() => {
    if (pathLanguage && pathLanguage !== language) {
      setLanguage(pathLanguage);
    }
  }, [language, pathLanguage, setLanguage]);

  const routeTo = (path: string) => localizePath(path, activeLanguage);

  const handleNavigate = (page: PageType, id?: string) => {
    navigate(routeTo(pageToPath(page, id)));
  };

  const currentPage = currentPath === '/' ? 'home' 
    : currentPath.startsWith('/ideas/new') ? 'submit'
    : currentPath.startsWith('/ideas') ? 'explore'
    : currentPath.startsWith('/tester-calls/new') ? 'newTesterCall'
    : currentPath.startsWith('/tester-calls') ? 'testerCall'
    : currentPath.startsWith('/mypage') ? 'profile' 
    : currentPath.startsWith('/login') ? 'login'
    : currentPath.startsWith('/pricing') ? 'pricing'
    : currentPath.startsWith('/admin/boosts') ? 'manageBoosts'
    : currentPath.startsWith('/salon') ? 'salon'
    : currentPath.startsWith('/membership') ? 'membership' : 'home';

  const noindex = [
    '/login',
    '/mypage',
    '/membership',
    '/ideas/new',
    '/tester-calls/new',
    '/admin/boosts',
    '/billing/success',
    '/billing/cancel',
    '/commerce',
  ].some(path => currentPath === path || currentPath.startsWith(`${path}/`));

  return (
    <div className="min-h-screen bg-bg-main text-text-dark font-sans selection:bg-primary-light selection:text-primary flex flex-col">
      <Seo noindex={noindex} />
      <Navbar navigate={handleNavigate} currentPage={currentPage as PageType} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home navigate={handleNavigate} />} />
            <Route path="/:lang" element={<Home navigate={handleNavigate} />} />
            <Route path="/ideas" element={<Explore navigate={handleNavigate} />} />
            <Route path="/:lang/ideas" element={<Explore navigate={handleNavigate} />} />
            <Route path="/ideas/new" element={<SubmitIdea navigate={handleNavigate} />} />
            <Route path="/:lang/ideas/new" element={<SubmitIdea navigate={handleNavigate} />} />
            <Route path="/ideas/:id" element={<IdeaDetailWrapper />} />
            <Route path="/:lang/ideas/:id" element={<IdeaDetailWrapper />} />
            <Route path="/tester-calls/new" element={<NewTesterCall navigate={handleNavigate} />} />
            <Route path="/:lang/tester-calls/new" element={<NewTesterCall navigate={handleNavigate} />} />
            <Route path="/tester-calls/:id" element={<TesterCallWrapper />} />
            <Route path="/:lang/tester-calls/:id" element={<TesterCallWrapper />} />
            <Route path="/mypage" element={<Profile navigate={handleNavigate} />} />
            <Route path="/:lang/mypage" element={<Profile navigate={handleNavigate} />} />
            <Route path="/login" element={<Login navigate={handleNavigate} />} />
            <Route path="/:lang/login" element={<Login navigate={handleNavigate} />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/:lang/pricing" element={<PricingPage />} />
            <Route path="/salon" element={<SalonPage />} />
            <Route path="/:lang/salon" element={<SalonPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/:lang/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/:lang/privacy" element={<PrivacyPage />} />
            <Route path="/commerce" element={<CommercePage />} />
            <Route path="/:lang/commerce" element={<CommercePage />} />
            <Route path="/billing/success" element={<BillingSuccessPage />} />
            <Route path="/:lang/billing/success" element={<BillingSuccessPage />} />
            <Route path="/billing/cancel" element={<BillingCancelPage />} />
            <Route path="/:lang/billing/cancel" element={<BillingCancelPage />} />
            <Route path="/membership" element={<MembershipPage navigate={handleNavigate} />} />
            <Route path="/:lang/membership" element={<MembershipPage navigate={handleNavigate} />} />
            <Route path="/admin/boosts" element={<ManageBoosts navigate={handleNavigate} />} />
            <Route path="/:lang/admin/boosts" element={<ManageBoosts navigate={handleNavigate} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
