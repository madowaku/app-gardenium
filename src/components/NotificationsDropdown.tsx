import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Circle, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types/appSproutTypes';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotificationsDropdown({ navigate }: { navigate: (page: string, id?: string) => void }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toMillis() || Date.now()
      } as AppNotification));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id!), { read: true });
      });
      await batch.commit();
    } catch(err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    setIsOpen(false);
    if (!notif.read && notif.id) {
      await updateDoc(doc(db, 'notifications', notif.id), { read: true });
    }
    
    if (notif.link) {
      if (notif.link.startsWith('/ideas/')) {
        navigate('ideaDetail', notif.link.replace('/ideas/', ''));
      } else if (notif.link.startsWith('/mypage')) {
        navigate('profile');
      } else {
        // default handling or custom routes
        navigate('home');
      }
    }
  };

  const getTimeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-muted hover:text-text-dark hover:bg-slate-50 transition-colors rounded-full"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border-color overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-4 border-b border-border-color bg-bg-main/50">
            <h3 className="font-bold text-text-dark">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-primary font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm font-medium">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-border-color">
                {notifications.map(notif => (
                  <li 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notif.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="pt-1">
                      {!notif.read && <Circle size={8} fill="currentColor" className="text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm text-text-dark leading-snug mb-1">{notif.message}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide">{getTimeAgo(notif.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
