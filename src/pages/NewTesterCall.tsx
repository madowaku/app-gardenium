import { useState, useEffect } from 'react';
import { ArrowLeft, TestTube2, AlertCircle, FileText, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { PageType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PopulatedIdea } from '../types/appSproutTypes';

interface NewTesterCallProps {
  navigate: (page: PageType, id?: string) => void;
}

export default function NewTesterCall({ navigate }: NewTesterCallProps) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [myIdeas, setMyIdeas] = useState<PopulatedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    ideaId: '',
    prototypeStage: 'Clickable Mockup',
    idealTester: '',
    testingGoal: '',
    actionLink: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('login');
      return;
    }

    const fetchIdeas = async () => {
      try {
        const q = query(collection(db, 'ideas'), where('authorId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const fetchedIdeas: PopulatedIdea[] = [];
        snapshot.forEach(doc => {
          fetchedIdeas.push({ id: doc.id, ...doc.data() } as any);
        });
        setMyIdeas(fetchedIdeas);
      } catch (err) {
        console.error('Failed to fetch ideas:', err);
        setError(t('tester.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [currentUser, navigate]);

  const handleSubmit = async () => {
    if (!formData.ideaId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const ideaRef = doc(db, 'ideas', formData.ideaId);
      await updateDoc(ideaRef, {
        stage: 'testing',
        testerCall: {
          prototypeStage: formData.prototypeStage,
          idealTester: formData.idealTester,
          testingGoal: formData.testingGoal,
          actionLink: formData.actionLink
        },
        updatedAt: serverTimestamp()
      });
      navigate('ideaDetail', formData.ideaId);
    } catch (err) {
      console.error('Submit tester recruitment failed', err);
      setError(t('tester.postError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <button 
        onClick={() => navigate('profile')}
        className="flex items-center gap-2 text-text-muted hover:text-text-dark font-medium mb-10 transition-colors"
      >
        <ArrowLeft size={18} />
        {t('tester.backToProfile')}
      </button>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-text-dark mb-4">
          {t('tester.recruitTitle')}
        </h1>
        <p className="text-xl font-light text-text-muted leading-relaxed">
          {t('tester.recruitSubtitle')}
        </p>
      </div>

      <div className="bg-bg-card rounded-[32px] p-8 md:p-12 border border-border-color shadow-sm relative overflow-hidden">
        {error && (
          <div className="mb-8 rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-bg-main">
           <div className={`h-full bg-indigo-500 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
            
            <div className="space-y-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-dark">
                {t('tester.step1.title')}
              </label>
              {loading ? (
                <div className="flex items-center gap-3 rounded-[16px] border border-border-color bg-white px-6 py-4 text-text-muted">
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('tester.loadingIdeas')}</span>
                </div>
              ) : myIdeas.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-border-color bg-white px-6 py-5 text-text-muted">
                  {t('tester.noIdeas')}
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={formData.ideaId}
                    onChange={(e) => setFormData({...formData, ideaId: e.target.value})}
                    className="w-full bg-white border border-border-color rounded-[16px] px-6 py-4 appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-text-dark font-medium shadow-sm cursor-pointer"
                  >
                    <option value="" disabled>{t('tester.step1.select')}</option>
                    {myIdeas.map(idea => (
                      <option key={idea.id} value={idea.id}>{idea.title}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-muted">
                    <ChevronDown size={20} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-dark">
                {t('tester.step1.stageLabel')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setFormData({...formData, prototypeStage: 'Clickable Mockup'})}
                  className={`border rounded-[16px] p-6 cursor-pointer relative transition-colors ${formData.prototypeStage === 'Clickable Mockup' ? 'border-indigo-500 bg-indigo-50' : 'border-border-color bg-white hover:bg-bg-main hover:border-gray-300'}`}
                >
                  {formData.prototypeStage === 'Clickable Mockup' && <div className="absolute top-4 right-4 text-indigo-500"><CheckCircle2 size={20}/></div>}
                  <FileText className={`w-8 h-8 mb-3 ${formData.prototypeStage === 'Clickable Mockup' ? 'text-indigo-500' : 'text-text-muted'}`} />
                  <h4 className="font-bold text-text-dark mb-1">{t('tester.stage.mockup')}</h4>
                  <p className="text-xs text-text-muted">{t('tester.stage.mockupDesc')}</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, prototypeStage: 'Alpha Build'})}
                  className={`border rounded-[16px] p-6 cursor-pointer relative transition-colors ${formData.prototypeStage === 'Alpha Build' ? 'border-indigo-500 bg-indigo-50' : 'border-border-color bg-white hover:bg-bg-main hover:border-gray-300'}`}
                >
                  {formData.prototypeStage === 'Alpha Build' && <div className="absolute top-4 right-4 text-indigo-500"><CheckCircle2 size={20}/></div>}
                  <TestTube2 className={`w-8 h-8 mb-3 ${formData.prototypeStage === 'Alpha Build' ? 'text-indigo-500' : 'text-text-muted'}`} />
                  <h4 className="font-bold text-text-dark mb-1">{t('tester.stage.alpha')}</h4>
                  <p className="text-xs text-text-muted">{t('tester.stage.alphaDesc')}</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, prototypeStage: 'Private Beta'})}
                  className={`border rounded-[16px] p-6 cursor-pointer relative transition-colors ${formData.prototypeStage === 'Private Beta' ? 'border-indigo-500 bg-indigo-50' : 'border-border-color bg-white hover:bg-bg-main hover:border-gray-300'}`}
                >
                  {formData.prototypeStage === 'Private Beta' && <div className="absolute top-4 right-4 text-indigo-500"><CheckCircle2 size={20}/></div>}
                  <AlertCircle className={`w-8 h-8 mb-3 ${formData.prototypeStage === 'Private Beta' ? 'text-indigo-500' : 'text-text-muted'}`} />
                  <h4 className="font-bold text-text-dark mb-1">{t('tester.stage.beta')}</h4>
                  <p className="text-xs text-text-muted">{t('tester.stage.betaDesc')}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-color flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={loading || !formData.ideaId}
                className="px-8 py-3.5 bg-text-dark text-white rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {t('tester.nextStep')}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
            
            <div className="space-y-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-dark">
                {t('tester.step2.whoLabel')}
              </label>
              <p className="text-sm text-text-muted -mt-2">{t('tester.step2.whoHint')}</p>
              <input 
                type="text" 
                value={formData.idealTester}
                onChange={(e) => setFormData({...formData, idealTester: e.target.value})}
                placeholder={t('tester.step2.whoPlaceholder')}
                className="w-full bg-white border border-border-color rounded-[16px] px-6 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-text-dark font-medium shadow-sm block"
              />
            </div>

            <div className="space-y-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-dark">
                {t('tester.step2.whatLabel')}
              </label>
               <p className="text-sm text-text-muted -mt-2">{t('tester.step2.whatHint')}</p>
              <textarea 
                rows={5}
                value={formData.testingGoal}
                onChange={(e) => setFormData({...formData, testingGoal: e.target.value})}
                placeholder={t('tester.step2.whatPlaceholder')}
                className="w-full bg-white border border-border-color rounded-[16px] px-6 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-text-dark font-medium leading-relaxed resize-none shadow-sm block"
              ></textarea>
            </div>

             <div className="space-y-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-text-dark">
                {t('tester.step2.linkLabel')}
              </label>
              <div className="flex bg-white border border-border-color rounded-[16px] overflow-hidden shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
                <span className="bg-bg-main px-4 py-4 text-text-muted font-mono text-sm border-r border-border-color shrink-0 flex items-center">
                  https://
                </span>
                <input 
                  type="text" 
                  value={formData.actionLink}
                  onChange={(e) => setFormData({...formData, actionLink: e.target.value})}
                  placeholder={t('tester.step2.linkPlaceholder')}
                  className="w-full bg-transparent px-4 py-4 focus:outline-none text-text-dark font-medium"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border-color flex justify-between">
               <button 
                onClick={() => setStep(1)}
                className="px-8 py-3.5 bg-bg-main text-text-dark rounded-full font-bold hover:bg-gray-100 transition-colors border border-border-color"
              >
                {t('tester.back')}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !formData.idealTester || !formData.testingGoal}
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {submitting ? <><Loader2 size={18} className="animate-spin" /> {t('tester.submitting')}</> : t('tester.postBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
