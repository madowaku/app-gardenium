import { useState, useEffect } from 'react';
import { Leaf, ArrowRight, Lightbulb, Users, Code, Smartphone, Loader2 } from 'lucide-react';
import { getPopulatedIdeas } from '../data/dummyData';
import IdeaCard from '../components/IdeaCard';
import { PopulatedIdea } from '../types/appSproutTypes';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
  navigate: (page: string, id?: string) => void;
}

export default function Home({ navigate }: HomeProps) {
  const { t, language } = useLanguage();
  const [featuredIdeas, setFeaturedIdeas] = useState<PopulatedIdea[]>([]);
  const [shippedApps, setShippedApps] = useState<PopulatedIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const q = query(
          collection(db, 'ideas'), 
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'), 
          limit(12)
        );
        const querySnapshot = await getDocs(q);
        const fetchedIdeas: PopulatedIdea[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedIdeas.push({
            id: doc.id,
            ...data,
            type: data.type || (data.isSapling ? 'sprout' : 'seed'),
            stage: (data.stage || 'seed').toLowerCase(),
            tags: data.tags || [],
            supportCount: data.supportCount || 0,
            commentCount: data.commentCount || 0,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
            author: { id: data.authorId, name: t('common.sproutThinker'), role: 'user', createdAt: 0 }
          } as any);
        });

        if (fetchedIdeas.length === 0) {
          const allDummy = getPopulatedIdeas();
          setFeaturedIdeas(allDummy.filter(i => i.stage !== 'released').slice(0, 3));
          setShippedApps(allDummy.filter(i => i.stage === 'released').slice(0, 3));
        } else {
          setFeaturedIdeas(fetchedIdeas.filter(i => i.stage !== 'released').slice(0, 3));
          setShippedApps(fetchedIdeas.filter(i => i.stage === 'released').slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching featured ideas:", error);
        setFeaturedIdeas(getPopulatedIdeas().slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdeas();
  }, []);

  return (
    <div className="space-y-32 pb-16">
      {/* Editorial Hero Section */}
      <section className="pt-20 md:pt-32 text-center max-w-4xl mx-auto px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white text-text-dark border border-border-color text-xs uppercase tracking-[0.2em] font-black mb-10 shadow-sm transition-all hover:border-primary/30">
          <SproutIcon className="w-5 h-5" />
          {t('home.label')}
        </div>
        <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tighter text-text-dark mb-8 leading-[1.05] whitespace-pre-wrap">
          {t('home.hero')}
        </h1>
        <p className="text-xl md:text-2xl text-text-muted mb-12 leading-relaxed font-light max-w-2xl mx-auto whitespace-pre-wrap opacity-90">
          {t('home.subhero')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button 
            onClick={() => navigate('submit')}
            className="w-full sm:w-auto px-12 py-5 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-xl"
          >
            {t('home.postBtn')}
            <ArrowRight className="w-6 h-6" />
          </button>
          <button 
            onClick={() => navigate('explore')}
            className="w-full sm:w-auto px-12 py-5 bg-white text-text-dark border-2 border-border-color rounded-full font-bold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xl"
          >
            {t('home.exploreBtn')}
          </button>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="max-w-5xl mx-auto px-4">
        <h2 className="text-sm uppercase tracking-widest text-text-muted font-bold mb-10 text-center">{t('home.howItWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="relative">
            <div className="text-6xl font-serif text-sakura opacity-30 absolute -top-8 -left-4">01</div>
            <div className="relative z-10 pt-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border-color mb-6 shadow-sm">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-dark">{t('home.step1Title')}</h3>
              <p className="text-text-muted leading-relaxed font-light">
                {t('home.step1Desc')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="text-6xl font-serif text-sakura opacity-30 absolute -top-8 -left-4">02</div>
            <div className="relative z-10 pt-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border-color mb-6 shadow-sm">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-dark">{t('home.step2Title')}</h3>
              <p className="text-text-muted leading-relaxed font-light">
                {t('home.step2Desc')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="text-6xl font-serif text-sakura opacity-30 absolute -top-8 -left-4">03</div>
            <div className="relative z-10 pt-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border-color mb-6 shadow-sm">
                <Code className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-dark">{t('home.step3Title')}</h3>
              <p className="text-text-muted leading-relaxed font-light">
                {t('home.step3Desc')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Ideas */}
      <section className="px-4">
        <div className="flex justify-between items-end mb-8 max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl font-semibold text-text-dark mb-2 tracking-tight">{t('home.sproutingTitle')}</h2>
            <p className="text-text-muted">{t('home.sproutingDesc')}</p>
          </div>
          <button 
            onClick={() => navigate('explore')}
            className="text-primary font-medium hover:opacity-80 flex items-center gap-1 transition-opacity"
          >
            {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} navigate={navigate} />
            ))}
          </div>
        )}
      </section>

      {/* Success Stories: Released Apps */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          {shippedApps.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="w-14 h-14 bg-accent/20 rounded-2x; flex items-center justify-center border border-accent/30 shadow-sm">
                    <Leaf className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-medium text-text-dark tracking-tight leading-tight">{t('home.shippedTitle')}</h2>
                    <p className="text-text-muted">{t('home.shippedDesc')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('explore')}
                  className="hidden md:flex text-xs font-black uppercase tracking-[0.2em] bg-white border border-border-color px-8 py-3 rounded-full hover:bg-bg-main transition-all active:scale-95"
                >
                  {t('home.viewAll')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {shippedApps.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} navigate={navigate} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center bg-bg-card/50 rounded-[40px] border-2 border-dashed border-border-color/60 px-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-border-color/30">
                <Smartphone className="w-10 h-10 text-border-color" />
              </div>
              <h2 className="text-3xl font-serif font-medium text-text-dark mb-4">{t('home.shippedTitle')}</h2>
              <p className="text-text-muted mb-10 max-w-lg mx-auto font-light leading-relaxed">
                {t('home.shippedEmptyDesc')}
              </p>
              <button 
                onClick={() => navigate('explore')}
                className="px-10 py-4 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
              >
                {t('home.shippedEmptyBtn')}
              </button>
            </div>
          )}
          
          {shippedApps.length > 0 && (
            <div className="mt-8 p-10 bg-bg-main rounded-[32px] border border-dashed border-border-color text-center group cursor-pointer hover:border-accent/40 transition-all hover:bg-white" onClick={() => navigate('explore')}>
               <p className="text-text-muted font-black uppercase tracking-[0.2em] group-hover:text-accent transition-colors text-xs">
                 {t('common.allGrowthRecords')} →
               </p>
            </div>
          )}
        </div>
      </section>

      {/* Developer & Tester Split Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
        <div className="bg-text-dark text-white p-10 md:p-14 rounded-[24px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Code className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <h2 className="font-serif italic text-4xl mb-4">{t('home.devTitle')}</h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
              {t('home.devDesc')}
            </p>
            <button 
              onClick={() => navigate('explore')}
              className="px-6 py-3 bg-white text-text-dark rounded-full font-medium hover:bg-gray-100 transition-colors shadow-sm"
            >
              {t('home.devBtn')}
            </button>
          </div>
        </div>

        <div className="bg-primary-light text-text-dark p-10 md:p-14 rounded-[24px] relative overflow-hidden border border-sakura">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Smartphone className="w-40 h-40 text-primary" />
          </div>
          <div className="relative z-10">
            <h2 className="font-serif italic text-4xl mb-4 text-primary">{t('home.testerTitle')}</h2>
            <p className="text-text-muted text-lg mb-8 leading-relaxed max-w-md">
              {t('home.testerDesc')}
            </p>
            <button 
              onClick={() => navigate('explore')}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              {t('home.testerBtn')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

function SproutIcon(props: any) {
  return (
    <img src="/icon192.png" alt="" className={props.className} />
  );
}
