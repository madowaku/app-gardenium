import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use the specific Firestore database ID from config if present
const firestoreSettings: Record<string, any> = {
  experimentalAutoDetectLongPolling: true,
};

export const db = initializeFirestore(
  app,
  firestoreSettings,
  (firebaseConfig as any).firestoreDatabaseId || undefined
);

export const auth = getAuth(app);
