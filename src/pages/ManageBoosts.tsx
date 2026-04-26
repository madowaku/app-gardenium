import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Check, X, Sprout, Flag, Trash2, EyeOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { SalonPost } from '../types/appSproutTypes';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

type ContentReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  reason: string;
  details?: string;
  status: string;
  createdAt?: any;
};

export default function ManageBoosts({ navigate }: { navigate: (p: string) => void }) {
  const { t, language } = useLanguage();
  const { appUser } = useAuth();
  const [appliedBoosts, setAppliedBoosts] = useState<SalonPost[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.role === 'admin') {
      fetchModerationData();
    } else {
      setLoading(false);
    }
  }, [appUser?.role]);

  const fetchModerationData = async () => {
    setLoading(true);
    try {
      const boostQuery = query(collection(db, 'salonPosts'), where('boostState', '==', 'applied'));
      const reportQuery = query(collection(db, 'contentReports'), where('status', '==', 'open'));
      const [boostSnap, reportSnap] = await Promise.all([getDocs(boostQuery), getDocs(reportQuery)]);
      const posts = boostSnap.docs.map(d => ({ id: d.id, ...d.data() } as SalonPost));
      const fetchedReports = reportSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as ContentReport))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      setAppliedBoosts(posts);
      setReports(fetchedReports);
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

  const handleHideIdea = async (report: ContentReport) => {
    if (report.targetType !== 'idea') return;
    try {
      await updateDoc(doc(db, 'ideas', report.targetId), {
        visibility: 'private',
        moderationState: 'hidden',
        moderationReason: report.reason || 'reported',
        moderatedBy: appUser?.id,
        moderatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'contentReports', report.id), {
        status: 'resolved_hidden',
        resolvedAt: serverTimestamp(),
      });
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error('Failed to hide idea:', err);
    }
  };

  const handleDeleteIdea = async (report: ContentReport) => {
    if (report.targetType !== 'idea') return;
    if (!window.confirm(t('moderation.confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'ideas', report.targetId));
      await updateDoc(doc(db, 'contentReports', report.id), {
        status: 'resolved_deleted',
        resolvedAt: serverTimestamp(),
      });
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error('Failed to delete idea:', err);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'contentReports', reportId), {
        status: 'dismissed',
        resolvedAt: serverTimestamp(),
      });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to dismiss report:', err);
    }
  };

  if (appUser?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <ShieldCheck className="w-12 h-12 text-text-muted/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-dark mb-2">{t('admin.forbiddenTitle')}</h1>
        <p className="text-text-muted">{t('admin.forbiddenDesc')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4 pt-10">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold text-text-dark">{t('admin.title')}</h1>
      </div>
      
      <p className="text-text-muted mb-8">{t('admin.desc')}</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-text-dark">{t('admin.reportsTitle')}</h2>
            </div>
            {reports.length === 0 ? (
              <div className="bg-bg-main rounded-3xl p-8 text-center border-2 border-dashed border-border-color/60">
                <p className="text-text-muted">{t('admin.noReports')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map(report => (
                  <div key={report.id} className="bg-white rounded-[24px] p-6 border border-border-color shadow-sm">
                    <div className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded inline-flex mb-3">
                      {report.targetType} / {report.reason}
                    </div>
                    <h3 className="text-lg font-bold text-text-dark mb-2">{report.targetTitle || report.targetId}</h3>
                    <p className="text-sm text-text-muted mb-4 whitespace-pre-wrap">{report.details || t('admin.noDetails')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {report.targetType === 'idea' && (
                        <>
                          <button onClick={() => handleHideIdea(report)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold hover:bg-amber-100">
                            <EyeOff size={14} /> {t('admin.hide')}
                          </button>
                          <button onClick={() => handleDeleteIdea(report)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-full text-xs font-bold hover:bg-red-100">
                            <Trash2 size={14} /> {t('admin.delete')}
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDismissReport(report.id)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-100">
                        <Check size={14} /> {t('admin.dismiss')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-text-dark">{t('admin.boostsTitle')}</h2>
            </div>
            {appliedBoosts.length === 0 ? (
              <div className="bg-bg-main rounded-3xl p-8 text-center border-2 border-dashed border-border-color/60">
                <p className="text-text-muted">{t('admin.noBoosts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appliedBoosts.map(post => (
                  <div key={post.id} className="bg-white rounded-[24px] p-6 border border-border-color shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded">Pending</div>
                      <span className="text-xs text-text-muted">{new Date(post.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-dark mb-2">{post.title}</h3>
                    <p className="text-sm text-text-muted mb-4 line-clamp-3">{post.body}</p>
                    <div className="text-xs text-text-muted mb-6">Author: {post.authorName}</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleApprove(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors">
                        <Check size={16} /> {t('admin.approve')}
                      </button>
                      <button onClick={() => handleReject(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors">
                        <X size={16} /> {t('admin.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
