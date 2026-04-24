import React from 'react';
import { Leaf, MessageSquare, Wrench, Sprout, TrendingUp, FlaskConical, TestTube2, ThumbsUp, CheckCircle2, Award } from 'lucide-react';
import { PopulatedIdea, IdeaStage } from '../types/appSproutTypes';
import { useLanguage } from '../contexts/LanguageContext';

interface IdeaCardProps {
  idea: PopulatedIdea;
  navigate: (page: string, id?: string) => void;
  key?: React.Key;
}

const getStageConfig = (stage: IdeaStage) => {
  switch (stage) {
    case 'seed':
      return { icon: <Sprout size={14} />, color: 'bg-accent-light text-accent border-accent/20' };
    case 'sprout':
      return { icon: <Leaf size={14} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    case 'growing':
      return { icon: <TrendingUp size={14} />, color: 'bg-blue-50 text-blue-600 border-blue-200/50' };
    case 'testing':
      return { icon: <TestTube2 size={14} />, color: 'bg-primary-light text-primary border-sakura/50' };
    case 'polishing':
      return { icon: <MessageSquare size={14} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200/50' };
    case 'launching':
      return { icon: <FlaskConical size={14} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200/50' };
    case 'released':
      return { icon: <CheckCircle2 size={14} />, color: 'bg-accent-light text-accent border-accent/40 shadow-sm ring-1 ring-accent/10' };
    case 'archived':
      return { icon: <Wrench size={14} />, color: 'bg-gray-100 text-gray-500 border-gray-200' };
    default:
      return { icon: <Sprout size={14} />, color: 'bg-gray-50 text-gray-700 border-gray-100' };
  }
};

export default function IdeaCard({ idea, navigate }: IdeaCardProps) {
  const { t, language } = useLanguage();
  const stageConfig = getStageConfig(idea.stage);
  const tags = idea.tags || [];
  const createdAt = typeof idea.createdAt === 'number' ? idea.createdAt : Date.now();

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + (language === 'ja' ? '' : ' ') + t('time.yearsAgo');
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (language === 'ja' ? '' : ' ') + t('time.monthsAgo');
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (language === 'ja' ? '' : ' ') + t('time.daysAgo');
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (language === 'ja' ? '' : ' ') + t('time.hoursAgo');
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (language === 'ja' ? '' : ' ') + t('time.minsAgo');
    if (seconds < 10) return t('time.justNow');
    return Math.floor(seconds) + (language === 'ja' ? '' : ' ') + t('time.secondsAgo');
  };

  return (
    <div 
      onClick={() => navigate('ideaDetail', idea.id)}
      className={`bg-bg-card rounded-3xl p-7 shadow-sm hover:shadow-md border transition-all cursor-pointer flex flex-col h-full group overflow-hidden relative ${idea.stage === 'released' ? 'border-accent/40 ring-1 ring-accent/5' : 'border-border-color'}`}
    >
      {idea.stage === 'released' && (
        <div className="absolute top-0 right-0 p-4 z-20">
          <div className="bg-accent text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1.5 animate-in fade-in zoom-in slide-in-from-top-2">
            <Award size={14} />
            {t('stage.released')}
          </div>
        </div>
      )}

      {idea.type === 'sprout' && idea.screenshots && idea.screenshots.length > 0 && (
        <div className="absolute top-0 right-0 left-0 h-24 mb-4 translate-y-[-10px] opacity-10 blur-sm overflow-hidden z-0">
           <img src={idea.screenshots[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="relative z-10 w-full flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${stageConfig.color}`}>
              {stageConfig.icon}
              {t(`stage.${idea.stage}`) || idea.stage}
            </div>
            {idea.type === 'sprout' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Leaf size={10} />
                {t('idea.saplingBadge')}
              </div>
            )}
          </div>
          <div className="text-xs text-text-muted font-medium font-serif italic">{formatRelativeTime(createdAt)}</div>
        </div>
        
        {idea.type === 'sprout' && idea.screenshots && idea.screenshots.length > 0 && (
          <div className="mb-4 h-36 w-full rounded-2xl overflow-hidden shadow-sm border border-border-color/50">
             <img src={idea.screenshots[0]} className="w-full h-full object-cover shrink-0" alt="App Preview" referrerPolicy="no-referrer"/>
          </div>
        )}

        <h3 className={`text-2xl font-serif font-medium mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2 ${idea.stage === 'released' ? 'text-text-dark' : 'text-text-dark'}`}>
          {idea.title}
        </h3>
        
        {idea.stage === 'released' && (
          <div className="mb-4 py-2 px-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center gap-2 text-accent text-xs font-semibold">
            <Sprout size={14} className="shrink-0" />
            <span>{idea.type === 'sprout' ? t('idea.originSapling') : t('idea.originSeed')}</span>
          </div>
        )}
        
        <p className="text-text-muted text-sm mb-6 flex-grow line-clamp-3 leading-relaxed font-light">
          {idea.oneLineSummary}
        </p>
      
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map(tag => (
          <span key={tag} className="bg-bg-main border border-border-color text-text-muted text-[11px] uppercase tracking-wider px-3 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-4 text-text-muted">
          <div className="flex items-center gap-1.5 transition-colors group-hover:text-accent" title="Supports">
            <ThumbsUp size={16} className={idea.supportCount > 0 ? "text-accent fill-accent/5" : ""} />
            <span className="text-xs font-bold font-sans">{idea.supportCount}</span>
          </div>
          <div className="flex items-center gap-1.5 transition-colors group-hover:text-blue-500" title="Comments">
            <MessageSquare size={16} />
            <span className="text-xs font-bold font-sans">{idea.commentCount || 0}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 max-w-[120px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted truncate">
            {idea.author?.name || t('common.anonymous')}
          </span>
        </div>
      </div>
    </div>
  );
}
