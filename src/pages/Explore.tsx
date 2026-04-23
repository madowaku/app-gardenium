import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { IdeaStage, STAGE_LABELS, PopulatedIdea } from '../types/appSproutTypes';
import { getPopulatedIdeas } from '../data/dummyData';
import IdeaCard from '../components/IdeaCard';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import Fuse from 'fuse.js';

interface ExploreProps {
  navigate: (page: string, id?: string) => void;
}

export default function Explore({ navigate }: ExploreProps) {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState<IdeaStage | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [ideas, setIdeas] = useState<PopulatedIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const STAGES: { label: string; value: IdeaStage | 'All' }[] = [
    { label: t('explore.allStages') || 'All Stages', value: 'All' },
    { label: t('stage.seed'), value: 'seed' },
    { label: t('stage.sprout'), value: 'sprout' },
    { label: t('stage.growing'), value: 'growing' },
    { label: t('stage.polishing'), value: 'polishing' },
    { label: t('stage.testing'), value: 'testing' },
    { label: t('stage.launching'), value: 'launching' },
    { label: t('stage.released'), value: 'released' },
  ];

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const q = query(
          collection(db, 'ideas'), 
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'), 
          limit(200)
        );
        const querySnapshot = await getDocs(q);
        const fetchedIdeas: PopulatedIdea[] = [];
        
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedIdeas.push({
              id: doc.id,
              type: data.type || (data.isSapling ? 'sprout' : 'seed'),
              title: data.title || '',
              oneLineSummary: data.oneLineSummary || '',
              problemDetails: data.problemDetails || '',
              targetUsers: data.targetUsers || '',
              alternatives: data.alternatives || '',
              frustrations: data.frustrations || '',
              minFeatures: data.minFeatures || '',
              tags: data.tags || [],
              stage: (data.stage || 'seed').toLowerCase(),
              demoUrl: data.demoUrl || '',
              whatItDoes: data.whatItDoes || '',
              currentStatus: data.currentStatus || '',
              lookingFor: data.lookingFor || [],
              struggles: data.struggles || '',
              screenshots: data.screenshots || [],
              authorId: data.authorId || '',
              supportCount: data.supportCount || 0,
              commentCount: data.commentCount || 0,
              builderReactionCount: data.builderReactionCount || 0,
              releaseStatus: data.releaseStatus || 'none',
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
              author: { id: data.authorId, name: t('common.sproutThinker'), role: 'user', createdAt: 0 } // Mock author
            } as any);
          });

        // Merge with dummy items temporarily if user wants to see populated mockups, but for now just use Firebase
        if (fetchedIdeas.length === 0) {
          setIdeas(getPopulatedIdeas());
        } else {
          // You could combine mock data and real data here if needed during dev
          // setIdeas([...fetchedIdeas, ...getPopulatedIdeas()]);
          setIdeas(fetchedIdeas);
        }
      } catch (error) {
        console.error("Error fetching ideas:", error);
         setIdeas(getPopulatedIdeas());
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdeas();
  }, []);

  const filteredIdeas = useMemo(() => {
    let result = ideas;

    if (activeStage !== 'All') {
      result = result.filter(idea => idea.stage === activeStage);
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['title', 'oneLineSummary', 'problemDetails', 'tags', 'whatItDoes'],
        threshold: 0.3,
        ignoreLocation: true,
      });
      result = fuse.search(searchQuery).map(res => res.item);
    }

    return result;
  }, [ideas, activeStage, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-5xl font-serif font-medium tracking-tight text-text-dark mb-4">{t('explore.title')}</h1>
        <p className="text-xl text-text-muted max-w-2xl font-light">
          {t('explore.subtitle')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 mb-10">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-8 py-5 bg-white border border-border-color rounded-[24px] text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-sm transition-all font-light text-xl"
            placeholder={t('explore.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-border-color rounded-full text-text-dark hover:bg-bg-card transition-all shadow-sm font-bold text-sm tracking-tight active:scale-95">
            <Filter size={18} className="text-text-muted" />
            {t('explore.filters')}
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-border-color rounded-full text-text-dark hover:bg-bg-card transition-all shadow-sm font-bold text-sm tracking-tight whitespace-nowrap active:scale-95">
            {t('explore.mostSupported')}
            <ChevronDown size={18} className="text-text-muted" />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide">
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => setActiveStage(stage.value)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeStage === stage.value 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-bg-card text-text-muted border border-border-color hover:text-text-dark'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
           <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
           <p className="font-medium">{t('common.loading')}</p>
        </div>
      ) : filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-bg-card rounded-[16px] border border-border-color border-dashed">
          <div className="w-16 h-16 mx-auto bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-text-dark mb-2">{t('common.searchNoResults')}</h3>
          <p className="text-text-muted mb-6">{t('common.searchNoResultsDesc')}</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveStage('All'); }}
            className="text-primary font-medium hover:opacity-80 transition-opacity"
          >
            {t('common.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
