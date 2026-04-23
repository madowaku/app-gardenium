import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch or create app user profile
        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            setAppUser(docSnap.data() as AppUser);
          } else {
            // Create user document
            const newAppUser: any = {
              id: user.uid,
              name: user.displayName || 'Sprout User',
              avatarUrl: user.photoURL || '',
              bio: '',
              role: 'user',
              plan: 'free',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newAppUser);
            
            // Re-fetch to get actual timestamp if needed, or just set locally
            setAppUser({
              ...newAppUser,
              createdAt: Date.now()
            } as AppUser);
          }
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
