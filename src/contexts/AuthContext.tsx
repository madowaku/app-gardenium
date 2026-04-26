import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { User as AppUser } from '../types/appSproutTypes';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  appUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = null;
      setCurrentUser(user);
      
      if (user) {
        if (process.env.NODE_ENV !== 'production') {
          console.log("[AuthContext] User Login detected:", {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
          });
        }
        // Fetch or create app user profile
        try {
          const userRef = doc(db, 'users', user.uid);
          const fallbackUser: AppUser = {
            id: user.uid,
            name: user.displayName || 'Sprout User',
            avatarUrl: user.photoURL || '',
            bio: '',
            role: 'user',
            plan: 'free',
            createdAt: Date.now(),
          };

          unsubscribeUserDoc = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
              setAppUser({ id: user.uid, ...docSnap.data() } as AppUser);
              return;
            }

            const newAppUser = {
              id: user.uid,
              name: (user.displayName || 'Sprout User').substring(0, 120),
              avatarUrl: user.photoURL || '',
              bio: '',
              role: 'user',
              plan: 'free',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newAppUser);
            setAppUser(fallbackUser);
          }, (error) => {
            const isOfflineError = error.message?.includes('client is offline');
            if (!isOfflineError) {
              console.warn("Error subscribing to user profile:", error);
            }
            setAppUser(fallbackUser);
          });
        } catch (error) {
          const isOfflineError = (error as any)?.message?.includes('client is offline');
          if (!isOfflineError) {
            console.warn("Error fetching/creating user profile:", error);
          }
          setAppUser({
            id: user.uid,
            name: user.displayName || 'Sprout User',
            avatarUrl: user.photoURL || '',
            bio: '',
            role: 'user',
            plan: 'free',
            createdAt: Date.now(),
          } as AppUser);
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeUserDoc?.();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
