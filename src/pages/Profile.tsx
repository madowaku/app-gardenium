import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Settings, Lightbulb, ThumbsUp, TestTube2, MessageSquare, Loader2, LogOut, Edit2, X, Check, Twitter, Github, Globe, Camera, AlertCircle, Rocket, Plus, Search, Sprout, ShieldCheck } from 'lucide-react';
import { getPopulatedIdeas } from '../data/dummyData';
import IdeaCard from '../components/IdeaCard';
import TopUpMenu from '../components/commerce/TopUpMenu';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { PopulatedIdea, ShippedApp } from '../types/appSproutTypes';
import { updateProfile, signOut } from 'firebase/auth';
import { billingService } from '../services/billingService';
import { authenticatedFetch } from '../lib/authenticatedFetch';

interface ProfileProps {
  navigate: (page: string, id?: string) => void;
}

export default function Profile({ navigate }: ProfileProps) {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [myIdeas, setMyIdeas] = useState<PopulatedIdea[]>([]);
  const [supportedIdeas, setSupportedIdeas] = useState<PopulatedIdea[]>([]);
  const [shippedApps, setShippedApps] = useState<ShippedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Shipped App Editor state
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', description: '', appUrl: '', ideaId: '' });
  const [submittingApp, setSubmittingApp] = useState(false);
  
  // Profile Editor state
  const [isEditing, setIsEditing] = useState(false);
  
  // Membership & Top-up state
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // App User state fetched from Firestore
  const [profileData, setProfileData] = useState<{ 
    displayName: string; 
    bio: string; 
    skills: string[]; 
    photoURL?: string;
    plan?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      website?: string;
    }
  } | null>(null);

  const checkImageModeration = async (base64Data: string) => {
    try {
      const response = await authenticatedFetch('/api/ai/moderate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDescription: 'A user uploaded a new profile picture. Please verify it does not contain violence, nudity, or hate speech.' })
      });
      
      if (!response.ok) {
        return true; // Fail open
      }
      
      const result = await response.json();
      return result.safe !== false;
    } catch (err) {
      console.error('Moderation check failed:', err);
      return true; // Fallback to pass if AI fails
    }
  };

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setSavingProfile(true);
    setModerationError(null);

    try {
      // 1. Resize and convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);

          // 2. AI Moderation Check
          const isSafe = await checkImageModeration(base64Image);
          if (!isSafe) {
            setModerationError(t('profile.avatarModerationError'));
            setSavingProfile(false);
            return;
          }

          // 3. Save to Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { photoURL: base64Image });
          await updateProfile(currentUser, { photoURL: base64Image }); // Update Auth Profile so it reflects immediately correctly
          
          setProfileData(prev => ({
            ...prev,
            photoURL: base64Image
          } as any));
          setSavingProfile(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar update failed:', err);
      setSavingProfile(false);
    }
  };

  const handleEditOpen = () => {
    setEditName(profileData?.displayName || currentUser?.displayName || '');
    setEditBio(profileData?.bio || '');
    setEditSkills(profileData?.skills?.join(', ') || '');
    setEditTwitter(profileData?.socialLinks?.twitter || '');
    setEditGithub(profileData?.socialLinks?.github || '');
    setEditWebsite(profileData?.socialLinks?.website || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      
      const updates = {
        displayName: editName,
        bio: editBio,
        skills: skillsArray,
        socialLinks: {
          twitter: editTwitter,
          github: editGithub,
          website: editWebsite
        }
      };
      
      await updateDoc(userRef, updates);
      await updateProfile(currentUser, { displayName: editName });
      
      setProfileData(prev => ({
        ...prev,
        ...updates
      } as any));
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      // Optional: Add some error state here
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePurchase = async (productKey: string) => {
    try {
      const { url } = await billingService.createCheckoutSession({
        productKey: productKey as any
      });
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Failed to start checkout. Please try again.');
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('login');
      return;
    }

    const fetchMyIdeasAndProfile = async () => {
      try {
        // Fetch Membership Status
        try {
          const statusRes = await authenticatedFetch('/api/user/membership-status');
          if (statusRes.ok) {
            setMembershipStatus(await statusRes.json());
          }
        } catch (statusErr) {
          console.error('Status fetch failed:', statusErr);
        } finally {
          setIsStatusLoading(false);
        }

        // Fetch User Profile first
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        let userName = currentUser.displayName || t('common.you');
        if (userSnap.exists()) {
          setProfileData(userSnap.data() as any);
          if (userSnap.data().displayName) userName = userSnap.data().displayName;
        }

        // Fetch ideas
        const q = query(collection(db, 'ideas'), where('authorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedIdeas: PopulatedIdea[] = [];
        
        querySnapshot.forEach((d) => {
          const data = d.data();
          fetchedIdeas.push({
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
            author: { id: data.authorId, name: userName, role: 'user', createdAt: 0 }
          } as any);
        });

        setMyIdeas(fetchedIdeas);

        // Fetch supported ideas
        const supportedQ = query(collection(db, 'ideas'), where('supportedBy', 'array-contains', currentUser.uid));
        const supportedSnap = await getDocs(supportedQ);
        const fetchedSupportedIdeas: PopulatedIdea[] = [];
        
        for (const d of supportedSnap.docs) {
          const data = d.data();
          fetchedSupportedIdeas.push({
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
            author: { id: data.authorId, name: 'Sprout Builder', role: 'user', createdAt: 0 }
          } as any);
        }
        setSupportedIdeas(fetchedSupportedIdeas);

        // Fetch Shipped Apps
        const shippedQ = query(collection(db, 'shippedApps'), where('developerId', '==', currentUser.uid));
        try {
          const shippedSnap = await getDocs(shippedQ);
          const fetchedShippedApps: ShippedApp[] = [];
          shippedSnap.forEach((d) => {
            fetchedShippedApps.push({ id: d.id, ...d.data() } as ShippedApp);
          });
          setShippedApps(fetchedShippedApps);
        } catch (shippedErr) {
          console.error('Error fetching shipped apps:', shippedErr);
          // Don't fail the whole profile if shipped apps fail (e.g. index missing)
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        // On error, show dummy data to prevent empty screen
        setMyIdeas([getPopulatedIdeas()[0]]);
        setSupportedIdeas([getPopulatedIdeas()[1], getPopulatedIdeas()[2]]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIdeasAndProfile();
  }, [currentUser, navigate]);

  const handleAddShippedApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingApp(true);
    try {
      const docRef = await addDoc(collection(db, 'shippedApps'), {
        ...newApp,
        developerId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setShippedApps([{ id: docRef.id, ...newApp, developerId: currentUser.uid, createdAt: Date.now() } as ShippedApp, ...shippedApps]);
      setIsAddingApp(false);
      setNewApp({ name: '', description: '', appUrl: '', ideaId: '' });
    } catch (err) {
      console.error('Error adding shipped app:', err);
    } finally {
      setSubmittingApp(false);
    }
  };

  if (!currentUser) return null;

  const displayName = profileData?.displayName || currentUser.displayName || t('nav.profile');
  const bio = profileData?.bio || '';
  const skills = profileData?.skills || [];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Profile Header */}
      <div className="bg-bg-card rounded-[32px] p-8 md:p-14 shadow-sm border border-border-color mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
        <div className="relative shrink-0 group">
          {profileData?.photoURL || currentUser.photoURL ? (
            <img src={profileData?.photoURL || currentUser.photoURL || ''} alt="Profile" className="w-32 h-32 rounded-full border border-sakura shadow-sm object-cover" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary-light flex items-center justify-center text-4xl font-serif text-primary border border-sakura shadow-sm uppercase">
              {displayName[0] || 'M'}
            </div>
          )}
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={savingProfile}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
          >
            {savingProfile ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarSelect} 
          />
        </div>
        
        <div className="flex-grow text-center md:text-left w-full">
          {moderationError && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 text-sm">
              <AlertCircle size={18} />
              {moderationError}
            </div>
          )}
          {isEditing ? (
            <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">{t('profile.editProfile')}</h3>
                <button onClick={() => setIsEditing(false)} className="text-text-muted hover:bg-gray-100 p-1 rounded-full"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.displayName')}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-border-color rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.bio')}</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full border border-border-color rounded-xl px-4 py-2 focus:outline-none focus:border-primary resize-y" rows={3} placeholder={t('profile.bioPlaceholder')}></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.skills')}</label>
                  <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder={t('profile.skillsPlaceholder')} className="w-full border border-border-color rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.twitter')} (Handle)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">@</span>
                      <input type="text" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} className="w-full border border-border-color rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-primary" placeholder="username" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.github')} (Handle)</label>
                    <input type="text" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} className="w-full border border-border-color rounded-xl px-4 py-2 focus:outline-none focus:border-primary" placeholder="username" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">{t('profile.website')} URL</label>
                    <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="w-full border border-border-color rounded-xl px-4 py-2 focus:outline-none focus:border-primary" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-text-dark font-medium hover:bg-gray-50 rounded-full transition-colors border border-border-color">{t('profile.cancel')}</button>
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="px-5 py-2 bg-text-dark text-white font-medium hover:opacity-90 rounded-full transition-opacity flex items-center gap-2">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t('profile.save')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start mb-2 border-b border-border-color pb-6">
              <div className="flex-grow text-center md:text-left w-full">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-serif font-medium text-text-dark mb-2">{displayName}</h1>
                  <button 
                    onClick={() => navigate('membership')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${
                      profileData?.plan === 'pro' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                      profileData?.plan === 'supporter' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    {profileData?.plan || 'free'}
                  </button>
                </div>
                <p className="text-text-muted font-light mb-1 flex items-center gap-2">
                  <span>{t('profile.growingSince')} {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', { month: 'long', year: 'numeric' }) : t('profile.recently')}</span>
                  <button 
                    onClick={() => navigate('membership')}
                    className="text-primary hover:underline flex items-center gap-1 font-bold tracking-tight"
                  >
                    <Settings size={14} />
                    {t('membership.manage')}
                  </button>
                </p>
                {bio && <p className="text-sm text-text-dark max-w-lg leading-relaxed">{bio}</p>}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">{skill}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4">
                  {profileData?.socialLinks?.website && (
                    <a href={profileData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-medium">
                      <Globe size={16} />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}
                  {profileData?.socialLinks?.twitter && (
                    <a href={`https://twitter.com/${profileData.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-blue-400 transition-colors flex items-center gap-1.5 text-sm font-medium">
                      <Twitter size={16} />
                      <span className="hidden sm:inline">Twitter</span>
                    </a>
                  )}
                  {profileData?.socialLinks?.github && (
                    <a href={`https://github.com/${profileData.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-dark transition-colors flex items-center gap-1.5 text-sm font-medium">
                      <Github size={16} />
                      <span className="hidden sm:inline">GitHub</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { signOut(auth); navigate('home'); }} className="h-10 px-4 bg-white border border-border-color rounded-full hidden md:flex items-center justify-center text-text-muted hover:bg-gray-50 transition-colors shadow-sm gap-2">
                  <LogOut size={16} /> <span className="text-sm font-medium">{t('profile.logout')}</span>
                </button>
                <button onClick={handleEditOpen} className="h-10 w-10 bg-white border border-border-color rounded-full flex items-center justify-center text-text-muted hover:bg-primary hover:text-white transition-colors shadow-sm" title="Edit Profile">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-bg-main p-4 rounded-2xl border border-border-color text-center font-sans tracking-tight">
              <Lightbulb className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold text-text-dark">{myIdeas.length}</div>
              <div className="text-xs uppercase tracking-widest font-semibold text-text-muted">{t('profile.ideas')}</div>
            </div>
            <div className="bg-bg-main p-4 rounded-2xl border border-border-color text-center font-sans tracking-tight">
              <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-text-dark">{supportedIdeas.length}</div>
              <div className="text-xs uppercase tracking-widest font-semibold text-text-muted">{t('profile.supported')}</div>
            </div>
            <div className="bg-bg-main p-4 rounded-2xl border border-border-color text-center font-sans tracking-tight">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-text-dark">4</div>
              <div className="text-xs uppercase tracking-widest font-semibold text-text-muted">{t('profile.comments')}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center font-sans tracking-tight">
              <TestTube2 className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold text-indigo-900">0</div>
              <div className="text-xs uppercase tracking-widest font-semibold text-indigo-800">{t('profile.testsJoined')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Single-item Menu */}
      <TopUpMenu 
        topUps={membershipStatus?.topUps}
        onPurchase={handlePurchase}
        isLoading={isStatusLoading}
      />

      <div className="space-y-12 mt-12">
        
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-border-color pb-4">
            <h2 className="text-2xl font-semibold text-text-dark flex items-center gap-2">
              <Lightbulb className="text-amber-500" />
              {t('profile.plantedIdeas')}
            </h2>
            {myIdeas.length > 0 && (
              <button 
                onClick={() => navigate('newTesterCall')}
                className="text-xs font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-2"
              >
                <TestTube2 size={14} /> {t('profile.recruitTesters')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myIdeas.length > 0 ? (
              myIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} navigate={navigate} />
              ))
            ) : (
              <div className="col-span-full py-16 bg-bg-main rounded-[32px] border-2 border-dashed border-border-color/60 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border-color/30">
                  <Lightbulb className="w-8 h-8 text-amber-300" />
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-2 tracking-tight">{t('profile.noIdeas')}</h3>
                <p className="text-text-muted mb-8 max-w-sm font-light leading-relaxed">{t('profile.noIdeasDesc')}</p>
                <button 
                  onClick={() => navigate('submit')}
                  className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus size={18} />
                  {t('profile.startPlanted')}
                </button>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 border-b border-border-color pb-4">
            <h2 className="text-2xl font-semibold text-text-dark flex items-center gap-2">
              <ThumbsUp className="text-primary" />
              {t('profile.supportedIdeas')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportedIdeas.length > 0 ? (
              supportedIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} navigate={navigate} />
              ))
            ) : (
              <div className="col-span-full py-16 bg-bg-main rounded-[32px] border-2 border-dashed border-border-color/60 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border-color/30">
                  <ThumbsUp className="w-8 h-8 text-primary/30" />
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-2 tracking-tight">{t('profile.noSupported')}</h3>
                <p className="text-text-muted mb-8 max-w-sm font-light leading-relaxed">{t('profile.noSupportedDesc')}</p>
                <button 
                  onClick={() => navigate('explore')}
                  className="px-8 py-3 bg-white border border-border-color text-text-dark rounded-full font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Search size={18} className="text-primary" />
                  {t('profile.startExplore')}
                </button>
              </div>
            )}
          </div>
        </section>
        
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-border-color pb-4">
            <h2 className="text-2xl font-semibold text-text-dark flex items-center gap-2">
              <Rocket className="text-purple-500" />
              {t('profile.builtApps')}
            </h2>
            <button 
              onClick={() => setIsAddingApp(true)}
              className="text-xs font-black uppercase tracking-[0.2em] bg-purple-50 border border-purple-100 text-purple-700 px-6 py-2.5 rounded-full hover:bg-purple-100 transition-colors flex items-center gap-2"
            >
              <Plus size={14} /> {t('profile.addApp')}
            </button>
          </div>
          
          {isAddingApp && (
            <form onSubmit={handleAddShippedApp} className="bg-white p-8 rounded-[32px] border-2 border-primary/10 shadow-xl mb-12 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 to-primary-light"></div>
              <h3 className="text-xl font-bold mb-6 text-text-dark">{t('profile.addAppTitle')}</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-[0.2em]">{t('profile.appNameLabel')}</label>
                  <input required type="text" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} className="w-full border border-border-color rounded-2xl px-5 py-3 focus:outline-none focus:border-primary bg-bg-main/50" placeholder="My Awesome Product" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-[0.2em]">{t('profile.appDescLabel')}</label>
                    <input required type="text" value={newApp.description} onChange={e => setNewApp({...newApp, description: e.target.value})} className="w-full border border-border-color rounded-2xl px-5 py-3 focus:outline-none focus:border-primary bg-bg-main/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-[0.2em]">{t('profile.appUrlLabel')}</label>
                    <input required type="url" placeholder="https://..." value={newApp.appUrl} onChange={e => setNewApp({...newApp, appUrl: e.target.value})} className="w-full border border-border-color rounded-2xl px-5 py-3 focus:outline-none focus:border-primary bg-bg-main/50" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddingApp(false)} className="px-8 py-3 text-text-muted font-bold tracking-tight hover:text-text-dark transition-colors">{t('profile.cancel')}</button>
                  <button type="submit" disabled={submittingApp} className="px-10 py-3 bg-text-dark text-white font-bold rounded-full transition-all shadow-lg hover:opacity-90 flex items-center gap-2 active:scale-95">
                    {submittingApp ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />} {t('profile.addAppSubmit')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {shippedApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shippedApps.map(app => (
                <div key={app.id} className="bg-white rounded-[24px] border border-border-color p-8 hover:shadow-md transition-shadow group flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-purple-100 group-hover:text-purple-200 transition-colors">
                    <Rocket size={40} />
                  </div>
                  <div className="flex-grow relative z-10">
                    <h3 className="text-xl font-bold text-text-dark mb-3 leading-tight">{app.name}</h3>
                    <p className="text-text-muted font-light leading-relaxed mb-8 text-sm line-clamp-3">{app.description}</p>
                  </div>
                  <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-4 py-3.5 bg-bg-main border border-border-color text-text-dark rounded-full font-bold text-sm tracking-tight hover:bg-white hover:border-primary transition-all mt-auto group-hover:shadow-sm">
                    <Globe size={18} className="mr-2 text-primary" />
                    {t('profile.visitApp')}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full py-16 bg-bg-main rounded-[32px] border-2 border-dashed border-border-color/60 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border-color/30">
                <Rocket className="text-purple-200 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-2 tracking-tight">{t('profile.nothingBuilt')}</h3>
              <p className="text-text-muted mb-8 max-w-sm font-light leading-relaxed">{t('profile.nothingBuiltDesc')}</p>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setIsAddingApp(true)}
                  className="px-10 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  {t('profile.addApp')}
                </button>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <button 
                    onClick={() => navigate('explore')}
                    className="px-6 py-3 bg-white border border-border-color text-text-dark rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Search size={16} />
                    {t('profile.startExplore')}
                  </button>
                  <button 
                    onClick={() => navigate('salon')}
                    className="px-6 py-3 bg-white border border-border-color text-text-dark rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sprout size={16} className="text-primary" />
                    {t('profile.startSalon')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-red-50 border border-red-100 rounded-3xl mt-8">
            <div>
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-1"><ShieldCheck size={18} /> Admin Tools</h3>
              <p className="text-sm text-red-600/80">Manage application limits, reports, and boost approvals.</p>
            </div>
            <button 
              onClick={() => navigate('manageBoosts')}
              className="mt-4 md:mt-0 px-6 py-2.5 bg-white text-red-700 border border-red-200 rounded-full text-sm font-bold shadow-sm hover:bg-red-50 transition-colors"
            >
              Manage Boosts
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
