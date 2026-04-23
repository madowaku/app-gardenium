import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import IdeaDetail from './pages/IdeaDetail';
import SubmitIdea from './pages/SubmitIdea';
import TesterCall from './pages/TesterCall';
import NewTesterCall from './pages/NewTesterCall';
import Profile from './pages/Profile';
import Login from './pages/Login';
import PricingPage from './components/PricingPage';
import SalonPage from './components/SalonPage';
import Footer from './components/Footer';
import CommercePage from './pages/CommercePage';
import { TermsPage, PrivacyPage } from './pages/LegalPages';
import ManageBoosts from './pages/ManageBoosts';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

import BillingSuccessPage from './pages/billing/BillingSuccessPage';
import BillingCancelPage from './pages/billing/BillingCancelPage';
import MembershipPage from './pages/MembershipPage';

export type PageType = 'home' | 'explore' | 'ideaDetail' | 'submit' | 'testerCall' | 'newTesterCall' | 'profile' | 'login' | 'pricing' | 'terms' | 'privacy' | 'salon' | 'billingSuccess' | 'billingCancel' | 'membership' | 'manageBoosts';

function IdeaDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <IdeaDetail navigate={(page, newId) => navigate(page === 'testerCall' ? `/tester-calls/${id}` : '/')} ideaId={id || null} />;
}

function TesterCallWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <TesterCall navigate={(page, newId) => navigate(page === 'ideaDetail' ? `/ideas/${id}` : '/')} ideaId={id || null} />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (page: PageType, id?: string) => {
    switch (page) {
      case 'home': navigate('/'); break;
      case 'explore': navigate('/ideas'); break;
      case 'ideaDetail': navigate(`/ideas/${id}`); break;
      case 'submit': navigate('/ideas/new'); break;
      case 'testerCall': navigate(`/tester-calls/${id}`); break;
      case 'newTesterCall': navigate('/tester-calls/new'); break;
      case 'profile': navigate('/mypage'); break;
      case 'login': navigate('/login'); break;
      case 'pricing': navigate('/pricing'); break;
      case 'salon': navigate('/salon'); break;
      case 'membership': navigate('/membership'); break;
      case 'manageBoosts': navigate('/admin/boosts'); break;
    }
  };

  const currentPage = location.pathname === '/' ? 'home' 
    : location.pathname.startsWith('/ideas/new') ? 'submit'
    : location.pathname.startsWith('/ideas') ? 'explore'
    : location.pathname.startsWith('/tester-calls/new') ? 'newTesterCall'
    : location.pathname.startsWith('/tester-calls') ? 'testerCall'
    : location.pathname.startsWith('/mypage') ? 'profile' 
    : location.pathname.startsWith('/login') ? 'login'
    : location.pathname.startsWith('/pricing') ? 'pricing'
    : location.pathname.startsWith('/admin/boosts') ? 'manageBoosts'
    : location.pathname.startsWith('/salon') ? 'salon'
    : location.pathname.startsWith('/membership') ? 'membership' : 'home';

  return (
    <div className="min-h-screen bg-bg-main text-text-dark font-sans selection:bg-primary-light selection:text-primary flex flex-col">
      <Navbar navigate={handleNavigate} currentPage={currentPage as PageType} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home navigate={handleNavigate} />} />
          <Route path="/ideas" element={<Explore navigate={handleNavigate} />} />
          <Route path="/ideas/new" element={<SubmitIdea navigate={handleNavigate} />} />
          <Route path="/ideas/:id" element={<IdeaDetailWrapper />} />
          <Route path="/tester-calls/new" element={<NewTesterCall navigate={handleNavigate} />} />
          <Route path="/tester-calls/:id" element={<TesterCallWrapper />} />
          <Route path="/mypage" element={<Profile navigate={handleNavigate} />} />
          <Route path="/login" element={<Login navigate={handleNavigate} />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/salon" element={<SalonPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/commerce" element={<CommercePage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/billing/cancel" element={<BillingCancelPage />} />
          <Route path="/membership" element={<MembershipPage navigate={handleNavigate} />} />
          <Route path="/admin/boosts" element={<ManageBoosts navigate={handleNavigate} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
