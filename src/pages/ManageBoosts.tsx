import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Check, X, Sprout } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { SalonPost } from '../types/appSproutTypes';
import { useLanguage } from '../contexts/LanguageContext';

export default function ManageBoosts({ navigate }: { navigate: (p: string) => void }) {
  const { t, language } = useLanguage();
  const [appliedBoosts, setAppliedBoosts] = useState<SalonPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoosts();
  }, []);

  const fetchBoosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'salonPosts'), where('boostState', '==', 'applied'));
      const snap = await getDocs(q);
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalonPost));
      setAppliedBoosts(posts);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'salonPosts', postId), {
        boostState: 'candidate',
        isBoostCandidate: true
      });
      setAppliedBoosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'salonPosts', postId), {
        boostState: 'none',
        isBoostCandidate: false
      });
      setAppliedBoosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4 pt-10">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold text-text-dark">Admin: Manage Boosts</h1>
      </div>
      
      <p className="text-text-muted mb-8">Approve or reject boost applications to feature them on the Salon and Home.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : appliedBoosts.length === 0 ? (
        <div className="bg-bg-main rounded-3xl p-12 text-center border-2 border-dashed border-border-color/60">
          <Sprout className="w-12 h-12 text-text-muted/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-dark mb-2">No pending applications</h2>
          <p className="text-text-muted">There are no boosts waiting for approval currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appliedBoosts.map(post => (
            <div key={post.id} className="bg-white rounded-[24px] p-6 border border-border-color shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded">Pending</div>
                <span className="text-xs text-text-muted">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-2">{post.title}</h3>
              <p className="text-sm text-text-muted mb-4 line-clamp-3">{post.body}</p>
              <div className="text-xs text-text-muted mb-6">Author: {post.authorName}</div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleApprove(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors"
                >
                  <Check size={16} /> Approve
                </button>
                <button 
                  onClick={() => handleReject(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
