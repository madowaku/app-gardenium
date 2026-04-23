import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { PageType } from '../App';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginProps {
  navigate: (page: PageType, id?: string) => void;
}

export default function Login({ navigate }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('home');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-md">
        <div className="bg-bg-card rounded-[32px] p-8 md:p-12 shadow-sm border border-border-color text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-emerald-400 to-sakura"></div>
          
          <div className="flex justify-center mb-8 relative">
            <div className="w-20 h-20 bg-emerald-50 rounded-[28px] overflow-hidden shadow-inner border border-emerald-100 flex items-center justify-center transform rotate-3 relative z-10 transition-transform hover:rotate-0 duration-500">
              <img 
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=300" 
                alt="Seedling" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center z-20 border border-slate-50">
              <Leaf className="text-primary w-4 h-4" />
            </div>
          </div>
          
          <h1 className="text-3xl font-serif font-medium text-text-dark mb-3">
            Welcome to <span translate="no">App Gardenium</span>
          </h1>
          <p className="text-text-muted mb-10 leading-relaxed text-sm">
            Join a community of builders and dreamers. Let's grow ideas together.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-border-color text-text-dark rounded-full font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          <p className="mt-8 text-xs text-text-muted">
            By continuing, you agree to our <span className="underline cursor-pointer hover:text-text-dark">Terms of Service</span> and <span className="underline cursor-pointer hover:text-text-dark">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
