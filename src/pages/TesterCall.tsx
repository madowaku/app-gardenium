import { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, ShieldCheck, Mail, Calendar, ExternalLink, TestTube2, Loader2, Users, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, increment, serverTimestamp, query, where } from 'firebase/firestore';
import { PopulatedIdea } from '../types/appSproutTypes';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface TesterCallProps {
  navigate: (page: string, id?: string) => void;
  ideaId: string | null;
}

export default function TesterCall({ navigate, ideaId }: TesterCallProps) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [idea, setIdea] = useState<PopulatedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [testers, setTesters] = useState<any[]>([]);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!ideaId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'ideas', ideaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const ideaData = docSnap.data();
          setIdea({ id: docSnap.id, ...ideaData } as any);

          if (currentUser) {
            if (currentUser.uid === ideaData.authorId) {
              const testersSnap = await getDocs(collection(db, 'ideas', ideaId, 'testers'));
              const testersData = testersSnap.docs.map(d => {
                const data = d.data();
                return {
                  id: d.id,
                  ...data,
                  appliedAt: data.appliedAt?.toMillis ? data.appliedAt.toMillis() : data.appliedAt,
                } as any;
              });
              setTesters(testersData);
              setHasApplied(testersData.some(t => t.userId === currentUser.uid));
            } else {
              const myApplicationQ = query(
                collection(db, 'ideas', ideaId, 'testers'),
                where('userId', '==', currentUser.uid)
              );
              const myApplicationSnap = await getDocs(myApplicationQ);
              setHasApplied(!myApplicationSnap.empty);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load tester call', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [ideaId, currentUser]);

  const handleApply = async () => {
    if (!currentUser || !ideaId || applying) return;
    setApplying(true);
    try {
      const testerData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        email: currentUser.email || '',
        appliedAt: serverTimestamp(),
        status: 'pending'
      };
      await addDoc(collection(db, 'ideas', ideaId, 'testers'), testerData);
      
      const docRef = doc(db, 'ideas', ideaId);
      await updateDoc(docRef, { 
        testerCount: increment(1),
        updatedAt: serverTimestamp()
      });

      if (idea?.authorId && idea.authorId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: idea.authorId,
          type: 'tester_apply',
          message: `${currentUser.displayName || '誰か'}さんが「${idea.title}」のテスターに応募しました！`,
          link: `/tester-calls/${ideaId}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      setHasApplied(true);
      setIdea(prev => prev ? { ...prev, testerCount: (prev.testerCount || 0) + 1 } : prev);
    } catch(err) {
      console.error(err);
      alert(language === 'ja' ? "応募に失敗しました" : "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!idea || !idea.testerCall) {
    return <div className="text-center py-20 text-text-muted">Tester call not found</div>;
  }

  const { testerCall } = idea as any;
  const isAuthor = currentUser?.uid === idea.authorId;
  const currentTesters = idea.testerCount || testers.length || 0;
  const maxTesters = 20; // Default limit or from testerCall.maxTesters if exists
  const availPercent = Math.min((currentTesters / maxTesters) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <button 
        onClick={() => navigate('ideaDetail', idea.id)}
        className="flex items-center gap-2 text-text-muted hover:text-text-dark font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Idea Details
      </button>

      <div className="bg-gradient-to-br from-indigo-50 to-primary-light border border-sakura rounded-[32px] p-10 md:p-14 shadow-sm relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm">
          <TestTube2 className="w-64 h-64 text-indigo-900" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="col-span-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-800 text-[10px] font-bold mb-6 uppercase tracking-widest border border-border-color shadow-sm">
              Closed Beta Invitation
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-text-dark mb-6 leading-tight">
              Test <br/><span className="text-primary italic">"{idea.title}"</span>
            </h1>
            <p className="text-xl text-text-muted font-light leading-relaxed mb-8 max-w-lg">
              A developer has started building this idea and is ready for early feedback. Join the 20-tester closed beta to shape the final product.
            </p>
            <div className="flex items-center gap-4">
              {!isAuthor ? (
                <button 
                  onClick={handleApply}
                  disabled={applying || hasApplied}
                  className={`px-10 py-4 rounded-full font-medium shadow-md transition-all text-lg active:scale-95 flex items-center justify-center gap-2 ${
                    hasApplied 
                      ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {applying ? <Loader2 className="animate-spin" size={20} /> : hasApplied ? <><Check size={20} /> Applied</> : 'Apply to Test'}
                </button>
              ) : (
                <div className="px-10 py-4 bg-indigo-100 text-indigo-800 rounded-full font-bold shadow-sm flex items-center gap-2">
                  <Users size={20} /> You are the creator
                </div>
              )}
              {testerCall.actionLink && (
                <a 
                  href={testerCall.actionLink.startsWith('http') ? testerCall.actionLink : `https://${testerCall.actionLink}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-6 py-4 bg-white text-indigo-600 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={18} /> prototype link
                </a>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-border-color text-center">
            <div className="text-5xl font-serif font-medium text-text-dark mb-2">
              {currentTesters}<span className="text-text-muted text-3xl">/{maxTesters}</span>
            </div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-6">Current Availability</div>
            
            <div className="w-full bg-bg-main rounded-full h-3 mb-6 border border-border-color">
              <div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${availPercent}%` }}></div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-text-dark uppercase tracking-widest">
              <Smartphone size={14} className="text-text-muted" /> Android Only
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-bg-card p-8 rounded-[24px] border border-border-color shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-text-dark mb-6 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" />
            Target Profile
          </h2>
          <p className="text-text-muted leading-relaxed">
            {testerCall.idealTester}
          </p>
        </div>
        
        <div className="bg-bg-card p-8 rounded-[24px] border border-border-color shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-text-dark mb-6 flex items-center gap-2">
            <TestTube2 className="text-indigo-600" />
            Testing Goal
          </h2>
          <p className="text-text-muted leading-relaxed mb-4 whitespace-pre-wrap">
            {testerCall.testingGoal}
          </p>
          <p className="text-xs uppercase tracking-widest font-bold text-text-muted mb-2 border-t pt-4 border-border-color">Prototype Type</p>
          <p className="text-text-dark font-medium leading-relaxed">
            {testerCall.prototypeStage}
          </p>
          
          <div className="mt-8 pt-6 border-t border-border-color">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-dark">Built by</p>
                <p className="text-sm text-text-muted">{idea.authorId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAuthor && testers.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-text-dark mb-6 flex items-center gap-2">
            <Users className="text-indigo-600" /> Tester Applications
          </h2>
          <div className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-main border-b border-border-color text-xs uppercase tracking-widest text-text-muted">
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Contact</th>
                    <th className="p-4 font-bold">Applied Date</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {testers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-text-dark">{t.userName}</td>
                      <td className="p-4 text-text-muted">
                        <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-indigo-600">
                          <Mail size={14} /> {t.email || "No email provided"}
                        </a>
                      </td>
                      <td className="p-4 text-text-muted text-sm">{t.appliedAt ? new Date(t.appliedAt).toLocaleDateString() : '-'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold capitalize">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
