import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  MessageCircle, 
  Sun, 
  Wind, 
  BookOpen, 
  Image as ImageIcon,
  Tag,
  ShieldCheck,
  Zap,
  MoreVertical,
  Heart,
  MessageSquare,
  Lightbulb,
  Lock,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { localizePath } from '../lib/i18nRoutes';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// types
import { Plan, PostRecord, SalonPost } from '../types/appSproutTypes';

import { useAuth } from '../contexts/AuthContext';
import { MAX_SALON_POST_BODY_LENGTH, salonService } from '../lib/salonService';
import { SalonPostCard } from './SalonPostCard';

import { userService } from '../services/userService';

const SalonPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { appUser, currentUser } = useAuth();
  
  // Internal state for posts and UI
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyPublishedId, setRecentlyPublishedId] = useState<string | null>(null);

  // Theme config state
  const [themeConfig, setThemeConfig] = useState<any>(null);
  const [themeLoading, setThemeLoading] = useState(true);
  
  const userPlan = appUser?.plan || 'free';
  const isLoggedIn = !!currentUser;

  const handlePlanSwitch = async (plan: Plan) => {
    if (!currentUser) return;
    try {
      await userService.updatePlan(currentUser.uid, plan);
      // AuthContext will automatically pick up the change via onSnapshot
    } catch (error) {
      console.error("Failed to switch plan:", error);
    }
  };
  
  // Real-time subscription
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = salonService.subscribePosts((fetchedPosts) => {
      // Map Firestore posts to PostRecord (including isMine check)
      const mappedPosts = fetchedPosts.map(p => ({
        ...p,
        isMine: p.authorId === currentUser?.uid,
        publishState: 'published' as const // Real posts are always published
      })) as any[];
      
      setPosts(mappedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, isLoggedIn]);

  // Fetch Theme Config
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const docRef = doc(db, 'appConfig', 'greenhouse');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setThemeConfig(docSnap.data());
        }
      } catch (err) {
        console.error('Failed to fetch greenhouse config:', err);
      } finally {
        setThemeLoading(false);
      }
    };
    fetchTheme();
  }, []);

  // Composer state
  const [postMode, setPostMode] = useState<'progress' | 'question'>('progress');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState(false);
  const [postBody, setPostBody] = useState('');
  
  const handlePublish = async () => {
    if (!postBody.trim() || !currentUser) return;
    
    setIsPublishing(true);
    setPublishError(false);
    
    try {
      const newPostId = await salonService.createPost({
        authorId: currentUser.uid,
        authorName: appUser?.name || 'Someone',
        authorPlan: userPlan,
        type: postMode,
        title: postMode === 'progress' ? t('salon.modeToggle.progress') : t('salon.modeToggle.question'),
        body: postBody.trim().slice(0, MAX_SALON_POST_BODY_LENGTH),
      });
      
      setPostBody('');
      setIsPublishing(false);
      setRecentlyPublishedId(newPostId);
    } catch (error) {
      console.error("Publish failed:", error);
      setIsPublishing(false);
      setPublishError(true);
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    // This is mostly handled by onSnapshot now, but keeping for direct UI updates if needed
    setRecentlyPublishedId(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-[#FCFDFB] min-h-screen font-sans text-slate-800 pb-24">
      {/* Test Toggle (Dev Only) */}
      {process.env.NODE_ENV !== 'production' && currentUser && (
      <div className="fixed bottom-6 right-6 z-50 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex gap-2">
        <button 
          onClick={() => handlePlanSwitch('free')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userPlan === 'free' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          {t('salon.testFree')}
        </button>
        <button 
          onClick={() => handlePlanSwitch('supporter')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userPlan === 'supporter' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          {t('salon.testSupporter')}
        </button>
        <button 
          onClick={() => handlePlanSwitch('pro')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${userPlan === 'pro' ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          {t('salon.testPro')}
        </button>
      </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        {/* Branded Background with Mesh Gradient and SVG accents */}
        <div className="absolute inset-x-0 top-0 h-full w-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#FCFDFB]"></div>
          {/* Mesh Gradient Accents */}
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[80%] bg-emerald-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
          <div className="absolute top-[10%] -right-[5%] w-[50%] h-[70%] bg-sky-100/30 rounded-full blur-[100px] mix-blend-multiply"></div>
          <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] bg-primary-light/40 rounded-full blur-[120px] mix-blend-multiply"></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FCFDFB]/40 to-[#FCFDFB]"></div>
        </div>
        
        <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 ${
              userPlan === 'pro' ? 'bg-sky-100 text-sky-700' : 
              userPlan === 'supporter' ? 'bg-emerald-100 text-emerald-700' : 
              'bg-slate-200 text-slate-700'
            }`}>
              {userPlan === 'pro' ? <Zap size={14} /> : userPlan === 'supporter' ? <ShieldCheck size={14} /> : <Lock size={14} />}
              {userPlan === 'pro' ? t('salon.proBadge') : userPlan === 'supporter' ? t('salon.supporterBadge') : t('salon.freeGateTitle')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-3">
              <Sprout className="text-emerald-500 hidden md:block" size={40} />
              {t('salon.title')}
            </h1>
            <p className="text-slate-500 max-w-xl leading-relaxed text-sm md:text-base font-medium">
              {t('salon.subtitle')} <br />
              {t('salon.desc')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {!isLoggedIn ? (
          <div className="max-w-3xl mx-auto mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none"></div>
              <div className="w-24 h-24 bg-emerald-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 relative z-10 text-emerald-500 rotate-3">
                <Sprout size={48} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 relative z-10">{t('salon.freeGateTitle')}</h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed relative z-10">
                {t('salon.freeGateDesc')}
              </p>
              
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl mb-10 border border-slate-100 relative z-10">
                <Lock size={14} />
                {t('salon.freeGateAccess')}
              </div>
              
              <div>
                <Link to={localizePath('/login', language)} className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 relative z-10">
                  {t('salon.freeGateBtn')}
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Main Feed */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            
            {/* Pro Posting Area OR Supporter Notice */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AnimatePresence mode="wait">
                {isLoggedIn ? (
                  <motion.div 
                    key="pro-post"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 shrink-0"></div>
                      <div className="flex-1">
                        
                        {/* Mode Toggles */}
                        <div className="flex gap-2 mb-3">
                          <button 
                            onClick={() => setPostMode('progress')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${postMode === 'progress' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            {t('salon.modeToggle.progress')}
                          </button>
                          <button 
                            onClick={() => setPostMode('question')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${postMode === 'question' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            {t('salon.modeToggle.question')}
                          </button>
                        </div>

                        <textarea 
                          value={postBody}
                          onChange={(e) => setPostBody(e.target.value)}
                          disabled={isPublishing}
                          maxLength={MAX_SALON_POST_BODY_LENGTH}
                          placeholder={postMode === 'progress' ? t('salon.postIdea') : 'What are you stuck on?'}
                          className="w-full bg-slate-50/50 rounded-2xl p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none min-h-[100px] border border-slate-100 disabled:opacity-50"
                        ></textarea>
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[11px] font-medium text-slate-400">
                            {postBody.trim().length}/{MAX_SALON_POST_BODY_LENGTH}
                          </span>
                          <div className="flex items-center gap-2 text-slate-400">
                            <button disabled={isPublishing} className="p-2 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"><ImageIcon size={18} /></button>
                          </div>
                          <div className="flex items-center gap-3">
                            {publishError && (
                              <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle size={14} /> {t('salon.publishFailed')}
                              </span>
                            )}
                            <button 
                              onClick={handlePublish}
                              disabled={!postBody.trim() || isPublishing}
                              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
                            >
                              {isPublishing ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  {t('salon.publishing')}
                                </>
                              ) : (
                                t('salon.postBtn')
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="beta-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Sprout size={120} />
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm text-emerald-500 flex items-center justify-center shrink-0 mx-auto md:mx-0 relative z-10">
                      <MessageCircle size={28} />
                    </div>
                    <div className="flex-1 relative z-10">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{t('salon.upgradePromptTitle')}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                        {t('salon.upgradePromptDesc')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Posts Feed */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-8">
              
              <div className="flex items-center items-baseline gap-4 mb-2">
                <h2 className="text-xl font-bold text-slate-800">{t('salon.wipTitle')}</h2>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-xs text-slate-400 font-medium">{t('salon.wipDesc')}</span>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border border-slate-100 border-dashed">
                  <Loader2 size={32} className="mx-auto text-emerald-400 mb-3 animate-spin" />
                  <p className="text-slate-400 text-sm font-medium">{t('salon.loadingPosts')}</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <SalonPostCard 
                     key={post.id} 
                     post={post} 
                     userPlan={userPlan} 
                     onUpdate={handlePostUpdate} 
                     isRecentlyPublished={recentlyPublishedId === post.id}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-slate-100 border-dashed">
                  <Sprout size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-400 text-sm font-medium">{t('salon.noPosts')}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Sidebar Ideas */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Weekly Theme */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-[32px] border border-amber-100/50 shadow-sm relative overflow-hidden min-h-[160px]"
            >
              <div className="absolute -top-4 -right-4 text-amber-200/50 rotate-12 pointer-events-none">
                <Sun size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={20} className="text-amber-500" />
                  <h3 className="font-bold text-amber-900">{t('salon.themeTitle')}</h3>
                </div>
                {themeLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={24} className="animate-spin text-amber-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-amber-700/80 mb-2 font-medium">
                      {(themeConfig?.weeklyThemeActive && themeConfig?.[`weeklyThemePrompt${language === 'en' ? 'En' : 'Ja'}`]) 
                        ? themeConfig[`weeklyThemePrompt${language === 'en' ? 'En' : 'Ja'}`] 
                        : t('salon.themeDesc')}
                    </p>
                    <div className="bg-white/60 backdrop-blur rounded-2xl p-4 font-bold text-amber-900 shadow-sm border border-white/50 text-sm whitespace-pre-wrap">
                      {(themeConfig?.weeklyThemeActive && themeConfig?.[`weeklyThemeTitle${language === 'en' ? 'En' : 'Ja'}`]) 
                        ? themeConfig[`weeklyThemeTitle${language === 'en' ? 'En' : 'Ja'}`] 
                        : t('salon.themeTopic')}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Salon Guide */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
            >
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <BookOpen size={18} className="text-slate-400" />
                {t('salon.guideTitle')}
              </h3>
              <div className="space-y-5">
                {[
                  { k: 'guide1' },
                  { k: 'guide2' },
                  { k: 'guide3' },
                  { k: 'guide4' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-mono text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-1">{t(`salon.${item.k}.title`)}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{t(`salon.${item.k}.desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Highlighted Sprouts (Boost) Mini Sidebar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-50 p-6 rounded-[32px] border border-slate-100"
            >
              <h3 className="font-bold text-slate-800 mb-2 relative inline-flex items-center gap-2">
                <Wind size={18} className="text-emerald-500" />
                {t('salon.boostTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 mb-5 font-medium">{t('salon.boostDesc')}</p>
              
              <div className="space-y-3">
                {posts.filter((p: PostRecord) => p.isBoostCandidate).map((post: PostRecord) => (
                  <div key={`boost-${post.id}`} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 shrink-0"></div>
                      <span className="text-[10px] font-bold text-slate-600">{post.authorName}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {post.title}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default SalonPage;
