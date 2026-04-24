import React, { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, Bot, ChevronRight, Leaf, Sprout, Check, LayoutGrid, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authenticatedFetch } from '../lib/authenticatedFetch';
import { compressImage } from '../lib/imageService';

interface SubmitIdeaProps {
  navigate: (page: string, id?: string) => void;
}

export default function SubmitIdea({ navigate }: SubmitIdeaProps) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-primary-light text-primary rounded-full flex items-center justify-center mb-8 shadow-sm">
          <Sprout className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-serif font-medium text-text-dark mb-4">
          {language === 'ja' ? 'ログインが必要です' : 'Login Required'}
        </h1>
        <p className="text-lg text-text-muted mb-10 leading-relaxed">
          {language === 'ja'
            ? 'アイデアを投稿するにはログインしてください。'
            : 'Please sign in to post your idea.'}
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-10 py-4 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          {t('nav.login')}
        </button>
      </div>
    );
  }
  const isRetryableSubmitError = (code: unknown) => {
    if (typeof code !== 'string') return false;
    const retryable = ['unavailable', 'deadline-exceeded', 'failed-precondition'];
    return retryable.some(err => code === err || code.endsWith(`/${err}`));
  };

  const [formData, setFormData] = useState({
    title: '',
    oneLineSummary: '',
    targetUsers: '',
    problemDetails: '',
    alternatives: '',
    frustrations: '',
    minFeatures: '',
    tags: '',
    isSapling: false,
    demoUrl: '',
    currentStatus: 'Mockup',
    lookingFor: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => {
      const current = prev.lookingFor;
      if (current.includes(value)) {
        return { ...prev, lookingFor: current.filter(i => i !== value) };
      } else {
        return { ...prev, lookingFor: [...current, value] };
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingImage(true);
    setError('');
    try {
      const newScreenshots: string[] = [];
      for (let i = 0; i < files.length; i++) {
        // Limit to max 4 screenshots to conserve Firestore space
        if (screenshots.length + newScreenshots.length >= 4) {
          setError(language === 'ja' ? '最大4枚までアップロード可能です。' : 'You can upload up to 4 screenshots.');
          break;
        }
        
        const compressed = await compressImage(files[i]);
        newScreenshots.push(compressed);
      }
      setScreenshots(prev => [...prev, ...newScreenshots]);
    } catch (err) {
      console.error("Image upload failed", err);
      setError('画像アップロードに失敗しました。');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceWithAI = async () => {
    if (!formData.title && !formData.oneLineSummary && !formData.targetUsers) {
      setError('Please fill in at least one field so the AI has context!');
      return;
    }
    
    setIsEnhancing(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/ai/enhance-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          oneLineSummary: formData.oneLineSummary,
          targetUsers: formData.targetUsers,
          problemDetails: formData.problemDetails,
          frustrations: formData.frustrations,
          alternatives: formData.alternatives,
          minFeatures: formData.minFeatures,
        }),
      });

      if (!response.ok) {
        throw new Error('AI enhancement request failed');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        title: result.enhancedTitle || prev.title,
        oneLineSummary: result.enhancedOneLineSummary || prev.oneLineSummary,
        problemDetails: result.enhancedProblemDetails || prev.problemDetails,
        alternatives: result.enhancedAlternatives || prev.alternatives,
        frustrations: result.enhancedFrustrations || prev.frustrations,
        minFeatures: result.enhancedMinFeatures || prev.minFeatures,
        tags: result.enhancedTags || prev.tags
      }));
      setShowDetails(true);
    } catch (err) {
      console.error('Enhance AI failed:', err);
      setError('Failed to enhance your idea with AI. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to post an idea.');
      return;
    }

    await currentUser.reload();
    if (!currentUser.emailVerified) {
      setError(language === 'ja'
        ? '投稿にはメール認証が必要です。Googleログインを利用するか、認証済みアカウントで再ログインしてください。'
        : 'Email verification is required to post. Please sign in with a verified account.'
      );
      return;
    }

    if (formData.title.length > 100) {
      setError(language === 'ja' ? 'タイトルは100文字以内で入力してください。' : 'Title must be 100 characters or fewer.');
      return;
    }

    if (formData.oneLineSummary.length > 200) {
      setError(language === 'ja' ? '一言サマリーは200文字以内で入力してください。' : 'One-line summary must be 200 characters or fewer.');
      return;
    }

    if (!navigator.onLine) {
      setError(language === 'ja'
        ? '現在オフラインです。ネットワーク接続を確認してから再投稿してください。'
        : 'You appear to be offline. Please reconnect and try submitting again.'
      );
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const docData: any = {
        title: formData.title,
        oneLineSummary: formData.oneLineSummary,
        targetUsers: formData.targetUsers,
        type: formData.isSapling ? 'sprout' : 'seed',
        stage: formData.isSapling ? 'sprout' : 'seed',
        authorId: currentUser.uid,
        supportCount: 0,
        supportedBy: [],
        commentCount: 0,
        builderReactionCount: 0,
        releaseStatus: 'none',
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (formData.isSapling) {
        docData.whatItDoes = formData.problemDetails; // Mapped
        docData.struggles = formData.frustrations; // Mapped
        docData.demoUrl = formData.demoUrl;
        docData.currentStatus = formData.currentStatus;
        docData.lookingFor = formData.lookingFor;
        docData.screenshots = screenshots; 
      } else {
        docData.problemDetails = formData.problemDetails;
        docData.alternatives = formData.alternatives;
        docData.frustrations = formData.frustrations;
        docData.minFeatures = formData.minFeatures;
        docData.tags = tagsArray;
      }

      const ideaRef = doc(collection(db, 'ideas'));

      const setDocWithTimeout = async () => {
        const timeoutMs = 15000;
        let timer: ReturnType<typeof setTimeout> | null = null;
        try {
          return await Promise.race([
            setDoc(ideaRef, docData),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                const timeoutError = new Error('Idea submission timed out');
                (timeoutError as any).code = 'deadline-exceeded';
                reject(timeoutError);
              }, timeoutMs);
            }),
          ]);
        } finally {
          if (timer) {
            clearTimeout(timer);
          }
        }
      };

      const submitViaServerFallback = async () => {
        const token = await currentUser.getIdToken(true);
        const { createdAt, updatedAt, ...payload } = docData;
        const controller = new AbortController();
        const fallbackTimer = setTimeout(() => controller.abort(), 10000);
        let response: Response;
        try {
          response = await fetch('/api/ideas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              ideaId: ideaRef.id,
              payload,
            }),
            signal: controller.signal,
          });
        } catch (fallbackErr: any) {
          if (fallbackErr?.name === 'AbortError') {
            const timeoutError = new Error('Idea submission fallback timed out');
            (timeoutError as any).code = 'deadline-exceeded';
            throw timeoutError;
          }
          throw fallbackErr;
        } finally {
          clearTimeout(fallbackTimer);
        }

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const httpError = new Error(body?.error || 'Fallback submission failed');
          (httpError as any).code = `http-${response.status}`;
          throw httpError;
        }
      };

      try {
        await setDocWithTimeout();
      } catch (writeErr: any) {
        if (isRetryableSubmitError(writeErr?.code)) {
          await submitViaServerFallback();
        } else {
          throw writeErr;
        }
      }

      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Error submitting idea:', err);
      if (err?.code === 'permission-denied') {
        setError(language === 'ja'
          ? '投稿権限エラーです。ログイン状態・メール認証・入力文字数（タイトル100文字/サマリー200文字）を確認してください。'
          : 'Permission denied. Check sign-in status, email verification, and title/summary length limits.'
        );
      } else if (isRetryableSubmitError(err?.code)) {
        setError(language === 'ja'
          ? '投稿処理がタイムアウトしました。接続状態を確認し、少し待ってから再試行してください。'
          : 'Submission timed out. Please check your connection and try again.'
        );
      } else {
        setError('Failed to submit idea. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-20 h-20 mx-auto bg-accent-light text-accent rounded-full flex items-center justify-center mb-8 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-text-dark mb-4">{t('submit.successTitle')}</h1>
        <p className="text-lg text-text-muted mb-10 leading-relaxed">
          {t('submit.successDesc')}
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate('explore')}
            className="px-8 py-4 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-colors"
          >
            {t('submit.successExplore')}
          </button>
          <button 
            onClick={() => navigate('profile')}
            className="px-8 py-4 bg-bg-card text-text-dark border border-border-color rounded-full font-medium hover:bg-bg-main transition-colors"
          >
            {t('submit.successProfile')}
          </button>
        </div>
      </div>
    );
  }

  // --- Seed Selection Mode ---
  if (!formData.isSapling && !showDetails && !formData.title && !formData.oneLineSummary) {
    return (
       <div className="max-w-4xl mx-auto pb-20">
        <button 
          onClick={() => navigate('explore')}
          className="flex items-center gap-2 text-text-muted hover:text-text-dark font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          {t('common.back')}
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-text-dark mb-4 flex items-center justify-center gap-3">
            {t('submit.mode.title')}
            <Sparkles className="text-sakura w-8 h-8" />
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <button 
            onClick={() => {
              setFormData(prev => ({...prev, isSapling: false}));
              setShowDetails(true); 
            }}
            className="flex flex-col items-center text-center p-10 rounded-[32px] bg-bg-card border-2 border-primary/20 hover:border-primary cursor-pointer transition-all shadow-sm group hover:shadow-md h-full"
          >
            <div className="w-20 h-20 bg-primary-light/50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sprout size={40} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-dark mb-3">{t('submit.mode.seed')}</h2>
            <p className="text-text-muted leading-relaxed font-medium">{t('submit.mode.seedDesc')}</p>
          </button>

          <button 
             onClick={() => {
              setFormData(prev => ({...prev, isSapling: true}));
              setShowDetails(true); 
             }}
            className="flex flex-col items-center text-center p-10 rounded-[32px] bg-bg-card border-2 border-emerald-200 hover:border-emerald-500 cursor-pointer transition-all shadow-sm group hover:shadow-md h-full"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Leaf size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-dark mb-3">{t('submit.mode.sapling')}</h2>
            <p className="text-text-muted leading-relaxed font-medium">{t('submit.mode.saplingDesc')}</p>
          </button>
        </div>
       </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <button 
        onClick={() => setShowDetails(false)}
        className="flex items-center gap-2 text-text-muted hover:text-text-dark font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        {t('common.back')}
      </button>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-semibold tracking-tight text-text-dark mb-4 flex items-center justify-center md:justify-start gap-3">
          {formData.isSapling ? t('submit.sapling.title') : t('submit.title')}
          {formData.isSapling ? <Leaf className="text-emerald-500 w-8 h-8" /> : <Sparkles className="text-sakura w-8 h-8" />}
        </h1>
        <p className="text-lg text-text-muted mb-2">
          {formData.isSapling ? t('submit.sapling.subtitle') : t('submit.subtitle')}
        </p>
        {!formData.isSapling && (
          <p className="text-sm font-medium text-text-muted/80">
            {t('submit.subtext')}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-card rounded-[24px] p-8 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-border-color space-y-8">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}
        
        {formData.isSapling && (
           <div className="mt-4 pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="block text-text-dark font-semibold text-sm">{t('submit.demoUrlLabel')}</label>
              <input 
                name="demoUrl"
                value={formData.demoUrl || ''}
                onChange={handleChange}
                type="url" 
                placeholder={t('submit.demoUrlPlaceholder')}
                className="w-full px-5 py-3 bg-bg-main border border-border-color rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-bg-card transition-all placeholder:text-text-muted/60 text-sm"
              />
           </div>
        )}

        {/* Required Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-text-dark font-semibold text-lg">{formData.isSapling ? t('submit.sapling.nameLabel') : t('submit.nameLabel')}</label>
            <input 
              required
              maxLength={100}
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text" 
              placeholder={t('submit.namePlaceholder')}
              className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-full text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all placeholder:text-text-muted/60"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-text-dark font-semibold text-lg">{formData.isSapling ? t('submit.sapling.summaryLabel') : t('submit.summaryLabel')}</label>
            <input 
              required
              maxLength={200}
              name="oneLineSummary"
              value={formData.oneLineSummary}
              onChange={handleChange}
              type="text" 
              placeholder={t('submit.summaryPlaceholder')}
              className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-full text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all placeholder:text-text-muted/60"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-text-dark font-semibold text-lg">{formData.isSapling ? t('submit.sapling.audienceLabel') : t('submit.audienceLabel')}</label>
            <input 
              required
              name="targetUsers"
              value={formData.targetUsers}
              onChange={handleChange}
              type="text" 
              placeholder={t('submit.audiencePlaceholder')}
              className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-full text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all placeholder:text-text-muted/60"
            />
          </div>
        </div>

        {!formData.isSapling && (
          <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-text-dark flex items-center gap-2 mb-0.5">
                <Sparkles size={14} className="text-indigo-400" />
                {t('submit.enhance')}
              </h4>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                {t('submit.enhanceHint')}
              </p>
            </div>
            <button 
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className="w-full sm:w-auto px-5 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-full font-bold shadow-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs whitespace-nowrap active:scale-95"
            >
              {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
              {isEnhancing ? t('submit.enhancing') : t('submit.enhance')}
            </button>
          </div>
        )}

        {/* Collapsible Details (Seed) OR Extended details (Sapling) */}
        {!formData.isSapling ? (
          <div className="pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-text-muted hover:text-text-dark text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-1 group"
            >
              <ChevronRight size={18} className={`transform transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`} />
              {t('submit.moreDetails')}
            </button>
            
            {showDetails && (
              <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="space-y-2">
                  <label className="block text-text-dark font-semibold text-base">{t('submit.problemLabel')}</label>
                  <textarea 
                    name="problemDetails"
                    value={formData.problemDetails}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t('submit.problemPlaceholder')}
                    className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-2xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all resize-y placeholder:text-text-muted/60"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block text-text-dark font-semibold text-base">{t('submit.alternativesLabel')}</label>
                  <input 
                    name="alternatives"
                    value={formData.alternatives}
                    onChange={handleChange}
                    type="text" 
                    placeholder={t('submit.alternativesPlaceholder')}
                    className="w-full px-5 py-3 bg-bg-main border border-border-color rounded-full text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all placeholder:text-text-muted/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-text-dark font-semibold text-base">{t('submit.frustrationsLabel')}</label>
                  <textarea 
                    name="frustrations"
                    value={formData.frustrations}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t('submit.frustrationsPlaceholder')}
                    className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-2xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all resize-y placeholder:text-text-muted/60"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block text-text-dark font-semibold text-base">{t('submit.minFeaturesLabel')}</label>
                  <textarea 
                    name="minFeatures"
                    value={formData.minFeatures}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t('submit.minFeaturesPlaceholder')}
                    className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-2xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all resize-y placeholder:text-text-muted/60"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block text-text-dark font-semibold text-base">{t('submit.tagsLabel')}</label>
                  <input 
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    type="text" 
                    placeholder={t('submit.tagsPlaceholder')}
                    className="w-full px-5 py-3 bg-bg-main border border-border-color rounded-full text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:bg-bg-card transition-all placeholder:text-text-muted/60"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 pt-6 border-t border-border-color">
            <div className="space-y-2">
              <label className="block text-text-dark font-semibold text-base">{t('submit.sapling.statusLabel')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: 'Mockup', label: t('submit.sapling.statusMock') },
                  { val: 'Prototype', label: t('submit.sapling.statusProto') },
                  { val: 'MVP', label: t('submit.sapling.statusMvp') },
                  { val: 'Testing', label: t('submit.sapling.statusTesting') }
                ].map(status => (
                  <button
                    key={status.val}
                    type="button"
                    onClick={() => setFormData({...formData, currentStatus: status.val})}
                    className={`px-3 py-3 rounded-2xl text-xs font-bold transition-all border ${formData.currentStatus === status.val ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-border-color text-text-muted hover:border-emerald-200'}`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-text-dark font-semibold text-base">{t('submit.sapling.lookLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 'Direction', label: t('submit.sapling.lookDirection') },
                  { val: 'Usability', label: t('submit.sapling.lookUsability') },
                  { val: 'Design', label: t('submit.sapling.lookDesign') },
                  { val: 'Features', label: t('submit.sapling.lookNeeds') },
                  { val: 'Testers', label: t('submit.sapling.lookTesters') }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleCheckboxChange(item.val)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${formData.lookingFor.includes(item.val) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-border-color text-text-muted hover:border-emerald-200'}`}
                  >
                    {formData.lookingFor.includes(item.val) && <Check size={14} />}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-text-dark font-semibold text-base">{t('submit.sapling.whatItDoesLabel')}</label>
              <textarea 
                name="problemDetails" 
                value={formData.problemDetails}
                onChange={handleChange}
                rows={3}
                placeholder={t('submit.sapling.whatItDoesPlaceholder')}
                className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-2xl text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-bg-card transition-all resize-y placeholder:text-text-muted/60"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-text-dark font-semibold text-base">{t('submit.sapling.strugglesLabel')}</label>
              <textarea 
                name="frustrations"
                value={formData.frustrations}
                onChange={handleChange}
                rows={3}
                placeholder={t('submit.sapling.strugglesPlaceholder')}
                className="w-full px-5 py-4 bg-bg-main border border-border-color rounded-2xl text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-bg-card transition-all resize-y placeholder:text-text-muted/60"
              ></textarea>
            </div>

            <div className="space-y-4">
              <label className="block text-text-dark font-semibold text-base">{t('submit.sapling.screenshotsLabel')}</label>
              
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {screenshots.map((src, idx) => (
                    <div key={idx} className="relative aspect-[9/16] rounded-xl overflow-hidden border border-border-color shadow-sm group bg-white">
                      <img src={src} className="w-full h-full object-cover" alt="Screenshot preview" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-2 right-2 bg-text-dark/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sakura shadow-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {screenshots.length < 4 && (
                <div 
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-border-color/60 rounded-3xl p-8 flex flex-col items-center justify-center bg-gray-50/30 group transition-all ${isUploadingImage ? 'opacity-50 cursor-wait' : 'hover:bg-emerald-50/20 hover:border-emerald-200 cursor-pointer'}`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {isUploadingImage ? (
                    <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
                  ) : (
                    <LayoutGrid className="text-text-muted/40 mb-2 group-hover:text-emerald-300 transition-colors" size={32} />
                  )}
                  <span className="text-sm font-semibold text-text-muted text-center px-4">
                    {t('submit.sapling.screenshotsHint')} (上限 4枚)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-border-color flex flex-col items-center justify-center text-center">
          <button 
            type="submit"
            disabled={loading || isEnhancing}
            className={`w-full sm:w-auto px-12 py-4 text-white rounded-full font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all text-lg mb-2 ${formData.isSapling ? 'bg-emerald-600' : 'bg-primary'}`}
          >
            {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : (formData.isSapling ? t('submit.sapling.submitBtn') : t('submit.submitBtn'))}
          </button>
          <p className="text-sm text-text-muted/90 font-medium">
            {t('submit.submitHint')}
          </p>
        </div>
      </form>
    </div>
  );
}
