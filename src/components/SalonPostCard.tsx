import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { salonService } from '../lib/salonService';
import { PostRecord, SalonComment, UserPlan } from '../types/appSproutTypes';
import { Heart, MessageSquare, Sun, CheckCircle2, Wind, MoreVertical, Edit2, Trash2, AlertCircle, Loader2, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface SalonPostCardProps {
  post: PostRecord;
  userPlan: UserPlan;
  onUpdate: (updatedPost: any) => void;
  isRecentlyPublished?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export const SalonPostCard: React.FC<SalonPostCardProps> = ({ post, userPlan, onUpdate, isRecentlyPublished }) => {
  const { t } = useLanguage();
  const { currentUser, appUser } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comments, setComments] = useState<SalonComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [hasCheered, setHasCheered] = useState(false);

  // Check if cheered on mount/userId change
  useEffect(() => {
    if (currentUser?.uid) {
      salonService.checkIfCheered(post.id, currentUser.uid).then(setHasCheered);
    }
  }, [post.id, currentUser?.uid]);

  // Subscribe to comments only when open
  useEffect(() => {
    if (isCommentOpen) {
      const unsubscribe = salonService.subscribeComments(post.id, setComments);
      return () => unsubscribe();
    }
  }, [post.id, isCommentOpen]);

  const handleCheer = async () => {
    if (userPlan === 'free' || !currentUser) return;
    try {
      const active = await salonService.toggleCheer(post.id, currentUser.uid);
      setHasCheered(active);
    } catch (error) {
      console.error("Cheer failed:", error);
    }
  };

  const handleApplyBoost = async () => {
    if (post.isMine && (!post.boostState || post.boostState === 'none')) {
      try {
        await salonService.applyBoost(post.id);
        // onUpdate is just for parent hints if needed
      } catch (error) {
        console.error("Boost application failed:", error);
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || userPlan === 'free' || !currentUser) return;
    
    try {
      await salonService.addComment(post.id, {
        authorId: currentUser.uid,
        authorName: appUser?.name || t('salon.postMine'),
        authorPlan: userPlan as 'supporter' | 'pro',
        body: commentText,
      });
      setCommentText('');
    } catch (error) {
      console.error("Comment failed:", error);
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '...';
    if (typeof dateInput === 'string') return dateInput;
    if (typeof dateInput === 'number') {
      const d = new Date(dateInput);
      return d.toLocaleDateString();
    }
    return '...';
  };

  return (
    <motion.div variants={itemVariants} className={`bg-white p-6 rounded-[32px] border ${post.isMine ? 'border-sky-100 shadow-sky-100/20' : 'border-slate-100'} shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col`}>
      
      {/* Publishing Overlay state */}
      {post.publishState === 'publishing' && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center">
           <div className="flex flex-col items-center gap-2">
             <Loader2 className="animate-spin text-emerald-500" size={24} />
             <span className="text-xs font-bold text-slate-500">{t('salon.publishing')}</span>
           </div>
        </div>
      )}
      
      {/* Failed state overlay hint */}
      {post.publishState === 'failed' && (
         <div className="absolute top-0 inset-x-0 h-1 bg-red-400 z-10"></div>
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 bg-gradient-to-br from-slate-100 to-slate-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                {post.isMine ? t('salon.postMine') : post.authorName}
              </span>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${post.authorPlan === 'pro' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {post.authorPlan}
              </span>
            </div>
            <span className="text-xs text-slate-400">{formatDate(post.updatedAt)}</span>
          </div>
        </div>
        
        {post.isMine && (
          <div className="flex items-center">
            {post.publishState === 'failed' && (
              <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded mr-2 flex items-center gap-1">
                <AlertCircle size={10} /> Failed
              </span>
            )}
            <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 group/menu relative">
              <MoreVertical size={16} />
              
              {/* Menu simulation */}
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all flex flex-col w-32 overflow-hidden z-30">
                <div className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium">
                  <Edit2 size={12} /> {t('salon.edit')}
                </div>
                <div className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-50">
                  <Trash2 size={12} /> {t('salon.delete')}
                </div>
              </div>
            </button>
          </div>
        )}
        {!post.isMine && (
           <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
             <MoreVertical size={16} />
           </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${
            post.type === 'progress' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
          }`}>
            {post.type === 'progress' ? t('salon.progressBadge') : t('salon.questionBadge')}
          </span>
          <h3 className="font-bold text-slate-900">{post.title}</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          {post.body}
        </p>
      </div>

      {post.screenshotUrl && (
        <div className="mb-5 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
          <img src={post.screenshotUrl} alt={post.title} className="w-full h-auto object-cover max-h-[300px]" referrerPolicy="no-referrer" />
        </div>
      )}

      {/* Post Success Hint Overlay */}
      {isRecentlyPublished && post.publishState === 'published' && (
        <div className="mb-4 mt-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3 text-sm text-emerald-800">
          <div className="text-emerald-500 shrink-0 mt-0.5"><Sprout size={18} /></div>
          <div>
            {post.type === 'progress' ? (
              <p>
                {t('salon.postSuccessHint')}
                {(!post.boostState || post.boostState === 'none') && (
                  <button onClick={handleApplyBoost} className="font-bold underline underline-offset-2 hover:text-emerald-600 transition-colors">
                    {t('salon.postSuccessHintAction')}
                  </button>
                )}。
              </p>
            ) : (
              <p>{t('salon.postSuccessHintQuestion')}</p>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-50 mt-auto">
        <button 
          onClick={handleCheer}
          disabled={userPlan === 'free'}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${hasCheered ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
        >
          <Heart size={16} className={hasCheered ? "fill-emerald-500" : ""} />
          {post.cheerCount > 0 && <span>{post.cheerCount}</span>}
          <span className="sr-only">{hasCheered ? t('salon.cheered') : t('salon.cheer')}</span>
        </button>
        
        <button 
          onClick={() => setIsCommentOpen(!isCommentOpen)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isCommentOpen ? 'text-sky-500' : 'text-slate-400 hover:text-sky-500'}`}
        >
          <MessageSquare size={16} />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
          <span className="sr-only">{t('salon.viewComments')}</span>
        </button>
        
        {(post.boostState === 'candidate' || post.isBoostCandidate) && (
          <div className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
            <Sun size={12} className="animate-spin-slow" />
            {t('salon.boostCandidate')}
          </div>
        )}
        {post.boostState === 'applied' && (
          <div className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} />
            {t('salon.boostApplied')}
          </div>
        )}
        {post.isMine && (!post.boostState || post.boostState === 'none') && !isRecentlyPublished && post.publishState === 'published' && (
          <button 
            onClick={handleApplyBoost}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest"
          >
            <Wind size={12} />
            {t('salon.applyBoost')}
          </button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {isCommentOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-2 border-t border-slate-50 space-y-4">
              {comments && comments.map(c => (
                 <div key={c.id} className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0"></div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-bold text-slate-800">{c.authorName}</span>
                       <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${c.authorPlan === 'pro' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {c.authorPlan}
                       </span>
                       <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                     </div>
                     <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100/50 px-3 py-2 rounded-2xl rounded-tl-none">{c.body}</p>
                   </div>
                 </div>
              ))}
              
              {/* Add comment field */}
              {userPlan !== 'free' && (
                <div className="flex gap-3 pt-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 shrink-0 border border-emerald-200/50"></div>
                  <div className="flex-1 flex items-center gap-2">
                     <input 
                       type="text" 
                       value={commentText}
                       onChange={(e) => setCommentText(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                       placeholder={t('salon.writeComment')}
                       className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-shadow"
                     />
                     <button 
                       onClick={handleSubmitComment}
                       disabled={!commentText.trim()}
                       className="shrink-0 p-2 text-emerald-500 disabled:text-slate-300 hover:bg-emerald-50 rounded-full transition-colors flex items-center justify-center active:scale-95"
                     >
                       <Sprout size={16} />
                     </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
