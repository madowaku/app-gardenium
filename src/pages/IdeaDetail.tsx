import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Loader2, Wrench, Sprout, TrendingUp, FlaskConical, TestTube2, ThumbsUp, Share2, Sparkles, UserPlus, PenTool, LayoutGrid, Globe, Bot, Check, ExternalLink, CheckCircle2, Award, Calendar, History, ArrowUpRight, Leaf } from 'lucide-react';
import { getPopulatedIdeaById, getPopulatedIdeas, getReleasesByIdeaId, getGrowthEventsByIdeaId } from '../data/dummyData';
import { IdeaStage, STAGE_LABELS, PopulatedIdea, Release, GrowthEvent } from '../types/appSproutTypes';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Type } from "@google/genai";
import { getAIModelForTask, getAIService } from '../lib/ai/modelRouting';
import { ProductDefinition, AiReport } from '../types/commerce';
import { PRODUCTS } from '../lib/commerce/products';
import { createPurchase, processMockPayment, fulfillPurchase } from '../lib/commerce/purchaseService';
import PurchaseConfirmModal from '../components/commerce/PurchaseConfirmModal';
import { AiReportCard } from '../components/commerce/AiReportCard';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

interface IdeaDetailProps {
  navigate: (page: string, id?: string) => void;
  ideaId: string | null;
}

const getStageConfig = (stage: IdeaStage) => {
  switch (stage) {
    case 'seed':
      return { icon: <Sprout size={16} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    case 'sprout':
      return { icon: <Leaf size={16} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    case 'growing':
      return { icon: <TrendingUp size={16} />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
    case 'testing':
      return { icon: <TestTube2 size={16} />, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    case 'polishing':
      return { icon: <MessageSquare size={16} />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
    case 'launching':
      return { icon: <FlaskConical size={16} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    case 'released':
      return { icon: <CheckCircle2 size={16} />, color: 'bg-accent-light text-accent border-accent-color/20 shadow-sm' };
    case 'archived':
      return { icon: <History size={16} />, color: 'bg-gray-100 text-gray-500 border-gray-200' };
    default:
      return { icon: <Sprout size={16} />, color: 'bg-gray-50 text-gray-700 border-gray-100' };
  }
};

export default function IdeaDetail({ navigate, ideaId }: IdeaDetailProps) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'wireframes' | 'discussion'>('overview');
  const [showShareToast, setShowShareToast] = useState(false);
  const [idea, setIdea] = useState<PopulatedIdea | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [growthEvents, setGrowthEvents] = useState<GrowthEvent[]>([]);
  const [translatedIdea, setTranslatedIdea] = useState<Partial<PopulatedIdea> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSupporting, setIsSupporting] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);

  // Commerce & AI Reports
  const [reports, setReports] = useState<AiReport[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportProduct = PRODUCTS.ai_report_basic;

  useEffect(() => {
    if (!ideaId) return;
    // Listen for reports
    const q = query(
      collection(db, 'aiReports'),
      where('postId', '==', ideaId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiReport));
      setReports(fetchedReports);
    }, (error) => {
      console.error("AI Reports listener error:", error);
      // If permission denied, we just set empty reports (likely a dummy idea or private idea)
      if (error.code === 'permission-denied') {
        setReports([]);
      }
    });
    return () => unsubscribe();
  }, [ideaId, currentUser?.uid]);

  useEffect(() => {
    const fetchIdeaAndComments = async () => {
      if (!ideaId) {
        setIdea(getPopulatedIdeas()[0] as any);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'ideas', ideaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Fetch author (mock implementation for author details, could fetch from users collection)
          let authorName = t('common.sproutThinker');
          if (data.authorId) {
             const userSnap = await getDoc(doc(db, 'users', data.authorId));
             if (userSnap.exists() && userSnap.data().displayName) {
                 authorName = userSnap.data().displayName;
             }
          }

          setIdea({
            id: docSnap.id,
            ...data,
            type: data.type || (data.isSapling ? 'sprout' : 'seed'),
            stage: (data.stage || 'seed').toLowerCase(),
            demoUrl: data.demoUrl || '',
            whatItDoes: data.whatItDoes || '',
            currentStatus: data.currentStatus || '',
            lookingFor: data.lookingFor || [],
            struggles: data.struggles || '',
            screenshots: data.screenshots || [],
            author: { id: data.authorId, name: authorName, role: 'user', createdAt: 0 }
          } as any);
          
          if (currentUser && data.supportedBy && Array.isArray(data.supportedBy)) {
            setHasSupported(data.supportedBy.includes(currentUser.uid));
          }

          // Fetch comments
          const commentsRef = collection(db, 'ideas', ideaId, 'comments');
          const q = query(commentsRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedComments: Comment[] = [];
          querySnapshot.forEach((d) => {
            const commentData = d.data();
            fetchedComments.push({
              id: d.id,
              text: commentData.text,
              authorId: commentData.authorId,
              authorName: commentData.authorName,
              createdAt: commentData.createdAt?.toMillis ? commentData.createdAt.toMillis() : Date.now()
            });
          });
          setComments(fetchedComments);

          // Fetch releases
          const releasesRef = collection(db, 'releases');
          const releaseQ = query(
            releasesRef, 
            where('ideaId', '==', ideaId),
            orderBy('releasedAt', 'desc')
          );
          const releaseSnap = await getDocs(releaseQ);
          const fetchedReleases: Release[] = [];
          releaseSnap.forEach(d => {
            fetchedReleases.push({ id: d.id, ...d.data() } as any);
          });
          setReleases(fetchedReleases);

          // Fetch growth events
          const geRef = collection(db, 'ideas', ideaId, 'growthEvents');
          const geSnap = await getDocs(query(geRef, orderBy('createdAt', 'desc')));
          const fetchedGE: GrowthEvent[] = [];
          geSnap.forEach(d => fetchedGE.push({ id: d.id, ...d.data() } as any));
          setGrowthEvents(fetchedGE);

        } else {
          // Fallback to dummy data if not found in Firestore
          const dIdea = getPopulatedIdeaById(ideaId);
          setIdea(dIdea as any);
          setReleases(getReleasesByIdeaId(ideaId));
          setGrowthEvents(getGrowthEventsByIdeaId(ideaId));
        }
      } catch (err) {
        console.error('Error fetching idea:', err);
        setIdea(getPopulatedIdeaById(ideaId) as any);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeaAndComments();
  }, [ideaId]);

  const handlePostComment = async () => {
    if (!currentUser || !newComment.trim() || !ideaId || !idea) return;

    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'ideas', ideaId, 'comments');
      const commentDoc = {
        text: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      };
      
      const addedDoc = await addDoc(commentsRef, commentDoc);
      
      
      // Update comment count on idea
      const ideaRef = doc(db, 'ideas', ideaId);
      await updateDoc(ideaRef, {
        commentCount: increment(1)
      });
      
      if (idea.authorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: idea.authorId,
          type: 'comment',
          message: `${currentUser.displayName || '誰か'}さんが「${idea.title}」にコメントしました。`,
          link: `/ideas/${ideaId}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setComments([{
        id: addedDoc.id,
        text: commentDoc.text,
        authorId: commentDoc.authorId,
        authorName: commentDoc.authorName,
        createdAt: Date.now()
      }, ...comments]);
      
      setIdea({
        ...idea,
        commentCount: (idea.commentCount || 0) + 1
      });
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSupportToggle = async () => {
    if (!currentUser) {
      navigate('login');
      return;
    }
    if (!ideaId || !idea || isSupporting) return;

    setIsSupporting(true);
    try {
      const ideaRef = doc(db, 'ideas', ideaId);
      if (hasSupported) {
        // Remove support
        await updateDoc(ideaRef, {
          supportedBy: arrayRemove(currentUser.uid),
          supportCount: increment(-1)
        });
        setIdea({
          ...idea,
          supportCount: Math.max(0, (idea.supportCount || 0) - 1)
        });
        setHasSupported(false);
      } else {
        // Add support
        await updateDoc(ideaRef, {
          supportedBy: arrayUnion(currentUser.uid),
          supportCount: increment(1)
        });

        if (idea.authorId !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: idea.authorId,
            type: 'like',
            message: `${currentUser.displayName || '誰か'}さんが「${idea.title}」にLIKEしました！`,
            link: `/ideas/${ideaId}`,
            read: false,
            createdAt: serverTimestamp()
          });
        }

        setIdea({
          ...idea,
          supportCount: (idea.supportCount || 0) + 1
        });
        setHasSupported(true);
      }
    } catch (err) {
      console.error('Error toggling support:', err);
    } finally {
      setIsSupporting(false);
    }
  };

  const handleBuyReport = async () => {
    if (!currentUser || !ideaId || isPurchasing) return;
    setIsPurchasing(true);
    try {
      const purchaseId = await createPurchase(currentUser.uid, reportProduct, ideaId);
      await processMockPayment(purchaseId);
      setIsGeneratingReport(true);
      await fulfillPurchase(purchaseId);
      setIsPurchaseModalOpen(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(language === 'ja' ? '購入処理に失敗しました。時間をおいて再度お試しください。' : 'Purchase failed. Please try again later.');
    } finally {
      setIsPurchasing(false);
      setIsGeneratingReport(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: idea.title,
          text: `Check out this app idea on App Gardenium: ${idea.oneLineSummary}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleTranslate = async () => {
    if (!idea || isTranslating) return;
    setIsTranslating(true);
    try {
      const ai = getAIService();
      const targetLang = language === 'ja' ? 'Japanese' : 'English';
      
      const prompt = `Translate the following text fields to ${targetLang}. Preserve the JSON structure exactly. Do not translate the tags array elements unless necessary, but translate the rest.
      JSON:
      {
        "title": "${idea.title.replace(/"/g, '\\"')}",
        "oneLineSummary": "${idea.oneLineSummary.replace(/"/g, '\\"')}",
        "problemDetails": "${idea.problemDetails.replace(/"/g, '\\"')}",
        "targetUsers": "${idea.targetUsers.replace(/"/g, '\\"')}",
        "alternatives": "${idea.alternatives.replace(/"/g, '\\"')}",
        "frustrations": "${idea.frustrations.replace(/"/g, '\\"')}",
        "minFeatures": "${idea.minFeatures.replace(/"/g, '\\"')}"
      }`;

      const response = await ai.models.generateContent({
        model: getAIModelForTask('translate_content'),
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              oneLineSummary: { type: Type.STRING },
              problemDetails: { type: Type.STRING },
              targetUsers: { type: Type.STRING },
              alternatives: { type: Type.STRING },
              frustrations: { type: Type.STRING },
              minFeatures: { type: Type.STRING },
            },
            required: ["title", "oneLineSummary", "problemDetails", "targetUsers", "alternatives", "frustrations", "minFeatures"]
          }
        }
      });

      const translatedData = JSON.parse(response.text.trim());
      setTranslatedIdea(translatedData);
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const currentIdea = translatedIdea ? { ...idea, ...translatedIdea } : idea;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!idea) {
    return <div className="text-center py-20">{t('common.ideaNotFound')}</div>;
  }

  const stageConfig = getStageConfig(idea.stage);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button 
        onClick={() => navigate('explore')}
        className="flex items-center gap-2 text-text-muted hover:text-text-dark font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        {t('common.back')}
      </button>

      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text-dark text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-5 z-50">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">{t('common.linkCopied')}</span>
        </div>
      )}

      <div className="bg-bg-card rounded-3xl p-8 md:p-14 shadow-sm border border-border-color mb-8 relative overflow-hidden">
        {idea.stage === 'released' && (
          <div className="absolute top-0 right-0 p-4 z-20">
            <div className="bg-accent text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-top-4">
              <Award size={18} />
              {t('stage.released')}
            </div>
          </div>
        )}

        {idea.stage === 'released' && (
           <div className="mb-12 p-8 bg-accent/5 rounded-[32px] border border-accent/20 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Award size={200} className="text-accent" />
              </div>
              <div className="w-20 h-20 bg-accent text-white rounded-full flex items-center justify-center shadow-lg relative z-10 shrink-0">
                <Leaf size={40} className="animate-pulse" />
              </div>
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-3xl font-serif font-bold text-text-dark mb-2">{t('idea.hasBoreFruit')}</h2>
                <p className="text-text-muted text-lg">{t('idea.grownFrom')}</p>
                {idea.releasedAt && (
                   <div className="flex items-center gap-2 mt-4 text-accent font-bold text-sm bg-accent/10 w-fit px-4 py-1 rounded-full mx-auto md:ml-0">
                     <Calendar size={14} />
                     {new Date(idea.releasedAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
                   </div>
                )}
              </div>
           </div>
        )}

        {/* Header Setup */}
        <div className="flex flex-col mb-12">
          <div className="flex justify-between items-start mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] uppercase tracking-widest font-bold ${stageConfig.color}`}>
              {stageConfig.icon}
              {t(`stage.${idea.stage}`) || idea.stage}
            </div>
            
            <div className="flex items-center gap-3 bg-bg-main pl-2 pr-4 py-1.5 rounded-full border border-border-color shadow-sm">
               <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-[10px] font-bold">
                 {idea.author?.name?.[0]?.toUpperCase() || 'U'}
               </div>
               <span className="text-xs font-medium text-text-dark">
                 {idea.author?.name || t('common.anonymous')}
               </span>
               <span className="text-[10px] uppercase tracking-widest text-text-muted hidden sm:inline">
                 • {new Date(idea.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
               </span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-text-dark mb-6 leading-tight">
            {currentIdea?.title}
          </h1>
          <p className="text-2xl font-light text-text-muted leading-relaxed max-w-4xl">
            {currentIdea?.oneLineSummary}
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-4 py-6 border-y border-border-color mb-8">
          <button 
            onClick={handleSupportToggle}
            disabled={isSupporting}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-medium transition-colors shadow-sm ${
              hasSupported 
                ? 'bg-sakura text-white border border-sakura hover:opacity-90'
                : 'bg-text-dark text-white hover:opacity-90'
            }`}
          >
            {isSupporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ThumbsUp size={18} className={hasSupported ? 'text-white' : 'text-sakura'} fill={hasSupported ? 'currentColor' : 'none'} />
            )}
            {hasSupported ? t('idea.supported') : t('idea.support')} ({idea.supportCount})
          </button>
          
          {idea.stage === 'released' && releases.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {releases[0].channels.map(channel => (
                <a 
                  key={channel.url}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-10 py-4 bg-accent text-white rounded-full font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-accent/20 active:scale-95 group"
                >
                  <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  {channel.label || t('idea.viewApp')}
                </a>
              ))}
            </div>
          ) : idea.stage === 'released' && idea.releaseUrl ? (
            <a 
              href={idea.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-10 py-4 bg-accent text-white rounded-full font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-accent/20 active:scale-95 group"
            >
              <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              {t('idea.viewApp')}
            </a>
          ) : idea.type === 'sprout' && idea.demoUrl ? (
            <a 
              href={idea.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <ExternalLink size={18} />
              {t('idea.tryPrototype')}
            </a>
          ) : idea.stage === 'Testing' ? (
             <button 
                onClick={() => navigate('testerCall', idea.id)}
                className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
               <TestTube2 size={18} />
               {t('idea.joinTest')}
             </button>
          ) : (
             <button className="flex items-center gap-2 px-8 py-3.5 bg-bg-card border border-border-color text-text-dark rounded-full font-medium hover:bg-bg-main transition-colors shadow-sm">
               <Wrench size={18} className="text-amber-500" />
               {t('idea.buildThis')} ({idea.builderReactionCount})
             </button>
          )}

          <div className="flex-grow"></div>
          
          <button 
            onClick={handleTranslate} 
            disabled={isTranslating}
            className="flex items-center gap-2 px-5 py-3.5 text-text-muted rounded-full font-medium hover:bg-gray-50 transition-colors mr-2 disabled:opacity-50 text-sm border border-transparent hover:border-border-color"
          >
            {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            {t('idea.translateContent')}
          </button>

          <button onClick={handleShare} className="flex items-center gap-2 px-6 py-3.5 bg-bg-card border border-border-color text-text-muted rounded-full font-medium hover:bg-bg-main transition-colors">
            <Share2 size={18} />
            {t('idea.share')}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 border-b border-border-color mb-10 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-dark border-b-2 border-transparent'}`}
          >
            {t('idea.overview')}
          </button>
          <button 
            onClick={() => setActiveTab('wireframes')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'wireframes' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-dark border-b-2 border-transparent'}`}
          >
            <LayoutGrid size={16} /> {t('idea.wireframes')} <span className="bg-bg-main border border-border-color px-2 py-0.5 rounded-full text-[10px]">1</span>
          </button>
          <button 
            onClick={() => setActiveTab('discussion')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'discussion' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-dark border-b-2 border-transparent'}`}
          >
            <MessageSquare size={16} /> {t('idea.discussion')} <span className="bg-bg-main border border-border-color px-2 py-0.5 rounded-full text-[10px]">{idea.commentCount}</span>
          </button>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Detail Column */}
          <div className="lg:col-span-2">
            
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  
                  {idea.type === 'sprout' && idea.screenshots && idea.screenshots.length > 0 && (
                    <section className="mb-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {idea.screenshots.map((src, index) => (
                          <div key={index} className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-border-color/50 bg-bg-main relative group">
                            <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="App Preview" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {idea.type === 'sprout' ? (
                    // Sapling Specific Overview
                    <div className="space-y-12">
                      <section className="bg-bg-main p-8 md:p-10 rounded-[32px] border border-border-color shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                            <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-2">
                              {t('idea.whatItDoes')}
                            </h3>
                            <p className="text-xl font-serif text-text-dark leading-relaxed whitespace-pre-wrap">
                              {currentIdea?.whatItDoes || currentIdea?.problemDetails}
                            </p>
                          </div>
                          
                          <div className="space-y-8">
                            <div>
                              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">{t('idea.audience')}</h3>
                              <p className="text-text-dark leading-relaxed font-light whitespace-pre-wrap">
                                {currentIdea?.targetUsers}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">{t('idea.currentStatus')}</h3>
                              <p className="text-text-dark leading-relaxed font-light whitespace-pre-wrap">
                                {currentIdea?.currentStatus === 'Mockup' ? t('submit.sapling.statusMock') :
                                 currentIdea?.currentStatus === 'Prototype' ? t('submit.sapling.statusProto') :
                                 currentIdea?.currentStatus === 'MVP' ? t('submit.sapling.statusMvp') :
                                 currentIdea?.currentStatus === 'Testing' ? t('submit.sapling.statusTesting') :
                                 currentIdea?.currentStatus || "WIP"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {(currentIdea?.lookingFor?.length > 0 || currentIdea?.struggles) && (
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {currentIdea?.lookingFor && currentIdea.lookingFor.length > 0 && (
                             <div>
                                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-2">
                                  {t('idea.lookingFor')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {currentIdea.lookingFor.map(item => (
                                    <span key={item} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium">
                                      {item === 'Direction' ? t('submit.sapling.lookDirection') :
                                       item === 'Usability' ? t('submit.sapling.lookUsability') :
                                       item === 'Design' ? t('submit.sapling.lookDesign') :
                                       item === 'Features' ? t('submit.sapling.lookNeeds') :
                                       item === 'Testers' ? t('submit.sapling.lookTesters') :
                                       item}
                                    </span>
                                  ))}
                                </div>
                             </div>
                           )}

                           {currentIdea?.struggles && (
                             <div>
                                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-2">
                                  {t('idea.struggles')}
                                </h3>
                                <p className="text-lg text-text-dark leading-relaxed border-l-[3px] border-emerald-500 pl-6 py-2 font-serif italic text-text-muted whitespace-pre-wrap">
                                  "{currentIdea.struggles}"
                                </p>
                             </div>
                           )}
                        </section>
                      )}
                    </div>
                  ) : (
                    // Seed Specific Overview (Original)
                    <div className="space-y-12">
                      {/* Cohesive Problem & Target Block */}
                      <section className="bg-bg-main p-8 md:p-10 rounded-[32px] border border-border-color shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                            <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary block"></span>
                              {t('idea.problem')}
                            </h3>
                            <p className="text-xl font-serif text-text-dark leading-relaxed whitespace-pre-wrap">
                              {currentIdea?.problemDetails}
                            </p>
                          </div>
                          
                          <div className="space-y-8">
                            <div>
                              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">{t('idea.audience')}</h3>
                              <p className="text-text-dark leading-relaxed font-light whitespace-pre-wrap">
                                {currentIdea?.targetUsers}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">{t('idea.alternatives')}</h3>
                              <p className="text-text-dark leading-relaxed font-light whitespace-pre-wrap">
                                {currentIdea?.alternatives}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="px-4">
                        <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4">{t('idea.frustrations')}</h3>
                        <p className="text-lg text-text-dark leading-relaxed border-l-[3px] border-sakura pl-6 py-2 font-serif italic text-text-muted whitespace-pre-wrap">
                          "{currentIdea?.frustrations}"
                        </p>
                      </section>

                      {/* Highlighted Must-Haves */}
                      <section>
                        <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center gap-2">
                           <Check size={16} className="text-emerald-500" />
                           {t('idea.mustHaves')}
                        </h3>
                        <div className="p-8 bg-emerald-50/50 rounded-[24px] border border-emerald-100/50 shadow-sm">
                          <p className="text-lg text-text-dark leading-relaxed whitespace-pre-wrap">
                            {currentIdea?.minFeatures}
                          </p>
                        </div>
                      </section>
                    </div>
                  )}

                  {/* Growth Log Section - Always visible at bottom of overview or if Released */}
                  <section className="pt-12 border-t border-border-color/60">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-bg-main rounded-full flex items-center justify-center border border-border-color shadow-sm">
                        <History size={18} className="text-text-muted" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-text-dark">{t('idea.growthLog')}</h3>
                    </div>

                    <div className="space-y-0 ml-5 border-l-2 border-dashed border-border-color pl-10 relative">
                       {/* Growth Events from Database */}
                       {growthEvents.map((ge, idx) => (
                         <div key={ge.id} className="relative pb-10">
                           <div className="absolute -left-[51px] top-0 w-5 h-5 bg-text-muted/40 rounded-full ring-4 ring-bg-card shadow-sm z-10 flex items-center justify-center">
                             <TrendingUp size={10} className="text-white" />
                           </div>
                           <div className="p-6 bg-white rounded-2xl border border-border-color shadow-sm transition-all hover:translate-x-1">
                             <h4 className="font-bold text-text-dark mb-1">{ge.title}</h4>
                             <p className="text-xs text-text-muted mb-2">{new Date(ge.createdAt).toLocaleDateString()}</p>
                             {ge.body && <p className="text-sm text-text-muted">{ge.body}</p>}
                           </div>
                         </div>
                       ))}

                       {/* Synthetic Steps (Fallbacks if no growth events) */}
                       {growthEvents.length === 0 && (
                         <>
                            {/* Release Step */}
                            {idea.stage === 'released' && (
                              <div className="relative pb-10">
                                <div className="absolute -left-[51px] top-0 w-5 h-5 bg-accent rounded-full ring-4 ring-bg-card shadow-sm z-10 flex items-center justify-center">
                                  <Award size={10} className="text-white" />
                                </div>
                                <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20 shadow-sm transition-all hover:translate-x-1">
                                  <h4 className="font-bold text-accent mb-1">{t('idea.atReleased')}</h4>
                                  {idea.releasedAt && <p className="text-xs text-text-muted mb-2">{new Date(idea.releasedAt).toLocaleDateString()}</p>}
                                  <p className="text-sm text-text-dark/80">{t('idea.atReleasedDesc')}</p>
                                </div>
                              </div>
                            )}

                            {/* Testing Phases */}
                            {(idea.stage === 'testing' || idea.stage === 'polishing' || idea.stage === 'launching' || idea.stage === 'released') && (
                              <div className="relative pb-10">
                                <div className="absolute -left-[51px] top-0 w-5 h-5 bg-indigo-500 rounded-full ring-4 ring-bg-card shadow-sm z-10"></div>
                                <div className="p-6 bg-white rounded-2xl border border-border-color shadow-sm transition-all hover:translate-x-1">
                                  <h4 className="font-bold text-text-dark mb-1">{t('idea.atTesting')}</h4>
                                  <p className="text-sm text-text-muted">{t('idea.atTestingDesc')}</p>
                                </div>
                              </div>
                            )}

                            {/* Sapling Step */}
                            {(idea.type === 'sprout' || idea.stage === 'released') && (
                              <div className="relative pb-10">
                                <div className="absolute -left-[51px] top-0 w-5 h-5 bg-emerald-500 rounded-full ring-4 ring-bg-card shadow-sm z-10"></div>
                                <div className="p-6 bg-white rounded-2xl border border-border-color shadow-sm transition-all hover:translate-x-1">
                                  <h4 className="font-bold text-text-dark mb-1">{t('idea.atSapling')}</h4>
                                  <p className="text-sm text-text-muted">{t('idea.atSaplingDesc')}</p>
                                </div>
                              </div>
                            )}
                         </>
                       )}

                       {/* Seed Step */}
                       <div className="relative">
                         <div className="absolute -left-[51px] top-0 w-5 h-5 bg-accent rounded-full ring-4 ring-bg-card shadow-sm z-10"></div>
                         <div className="p-6 bg-white rounded-2xl border border-border-color shadow-sm transition-all hover:translate-x-1">
                           <h4 className="font-bold text-text-dark mb-1">{t('idea.atSeed')}</h4>
                           <p className="text-xs text-text-muted mb-2">{new Date(idea.createdAt).toLocaleDateString()}</p>
                           <p className="text-sm text-text-muted">{t('idea.atSeedDesc')}</p>
                         </div>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'wireframes' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-border-color pb-4">
                    <h2 className="text-sm font-bold text-text-dark uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid size={16} className="text-primary" /> {t('idea.wireframesMVP')}
                    </h2>
                    <button className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary-light px-4 py-2 rounded-full transition-colors flex items-center gap-1">
                      {t('idea.addSketch')}
                    </button>
                  </div>

                  {/* MVP Lightweight Setup - Just a placeholder box for now */}
                  <div className="bg-bg-main border border-dashed border-border-color rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                       <PenTool size={24} className="text-text-muted" />
                     </div>
                     <p className="text-text-dark font-medium mb-2">{t('idea.noWireframes')}</p>
                     <p className="text-sm font-light text-text-muted max-w-sm">
                       {t('idea.noWireframesDesc')}
                     </p>
                     <button className="mt-6 border border-border-color bg-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                       {t('idea.uploadImage')}
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="space-y-12">
                  <section>
                    {currentUser ? (
                      <div className="flex gap-4 mb-10">
                        <div className="h-12 w-12 rounded-full border border-border-color shadow-sm shrink-0 my-auto bg-primary-light text-primary flex items-center justify-center text-lg font-serif">
                          {currentUser.displayName?.[0] || 'U'}
                        </div>
                        <div className="w-full flex gap-2">
                          <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            placeholder={t('idea.commentPlaceholder')}
                            className="flex-grow bg-bg-main border border-border-color rounded-full px-6 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-dark font-medium shadow-sm"
                          />
                          <button 
                            onClick={handlePostComment}
                            disabled={submittingComment || !newComment.trim()}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                          >
                            {submittingComment ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('idea.postComment')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 mb-8 bg-bg-main rounded-2xl border border-border-color">
                        <p className="text-text-muted mb-4">{t('idea.loginComment')}</p>
                        <button onClick={() => navigate('login')} className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:opacity-90">{t('idea.loginButton')}</button>
                      </div>
                    )}

                    <div className="space-y-8">
                      {comments.length === 0 ? (
                         <div className="text-center py-12 text-text-muted font-light flex flex-col items-center justify-center gap-4 bg-bg-main rounded-3xl border border-border-color">
                           <Sprout className="w-10 h-10 text-primary opacity-50" />
                           <p>{t('idea.emptyDiscussion')}</p>
                         </div>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                              {comment.authorName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-text-dark">{comment.authorName}</span>
                                <span className="text-xs text-text-muted uppercase tracking-widest">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-text-muted leading-relaxed">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            <div className="bg-gradient-to-b from-primary-light to-bg-card rounded-[24px] p-8 border border-sakura shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-50">
                 <Sparkles className="w-8 h-8 text-primary" />
               </div>
               <h3 className="text-sm uppercase tracking-widest text-primary font-bold mb-4 flex items-center gap-2 relative z-10">
                 {t('idea.aiAnalysisTitle')}
               </h3>
               <p className="text-text-dark text-sm leading-relaxed relative z-10 mb-6">
                 This idea focuses on solving <strong>{idea.targetUsers.split(',')[0]}</strong> pain points by offering <strong>{idea.minFeatures.split('.')[0]}</strong>. The primary differentiator is moving away from generic solutions to a specialized, automated approach.
               </p>
               
               <button 
                 onClick={() => setIsPurchaseModalOpen(true)}
                 className="w-full py-3 bg-white border border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 relative z-10 shadow-sm"
               >
                 <Bot size={16} />
                 {t('idea.aiAnalyzeBtn')}
               </button>
               <p className="text-[10px] text-primary/60 mt-3 text-center relative z-10 font-medium italic">
                 {t('idea.aiPaidFeature')}
               </p>
            </div>

            {reports.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold px-2">
                  {t('idea.pastAiAnalyses')}
                </h3>
                {reports.map(report => (
                  <AiReportCard key={report.id} report={report} />
                ))}
              </div>
            )}

            <div className="bg-bg-main rounded-[24px] p-8 border border-border-color shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-6 flex items-center gap-2">
                <FlaskConical size={14} className="text-indigo-500" />
                {t('idea.builderActivity')}
              </h3>
              
              {idea.builderReactionCount > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-bg-main absolute left-0 z-30"></div>
                        <div className="w-8 h-8 rounded-full bg-pink-200 border-2 border-bg-main absolute left-4 z-20"></div>
                        <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-bg-main absolute left-8 z-10"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-bg-main ml-12"></div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{idea.builderReactionCount} {t('idea.buildersInterested')}</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                    {t('idea.buildersInterestedDesc')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 bg-white rounded-xl border border-border-color shadow-sm p-4">
                  <p className="text-sm text-text-muted mb-4 font-medium">{t('idea.noBuilders')}</p>
                  <button className="w-full py-2.5 bg-bg-card border border-border-color rounded-xl text-sm font-bold text-text-dark hover:bg-bg-main transition-colors">
                    {t('idea.firstToBuild')}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-bg-main rounded-[24px] p-8 border border-border-color shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4">{t('submit.tagsLabel')}</h3>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map(tag => (
                  <span key={tag} className="bg-white border border-border-color text-text-muted text-xs px-4 py-1.5 rounded-full font-medium shadow-sm hover:border-gray-300 transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      <PurchaseConfirmModal 
        open={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onConfirm={handleBuyReport}
        product={reportProduct}
        isProcessing={isPurchasing || isGeneratingReport}
      />
    </div>
  );
}
