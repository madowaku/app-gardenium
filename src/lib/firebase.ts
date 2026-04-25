import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

if (process.env.NODE_ENV !== 'production') {
  console.log("[Firebase Client] Initialized with:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}

// Use the specific Firestore database ID from config if present
const firestoreSettings: Record<string, any> = {
  experimentalAutoDetectLongPolling: true,
};

const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = initializeFirestore(
  app,
  firestoreSettings,
  databaseId && databaseId !== "(default)" ? databaseId : undefined
);

export const auth = getAuth(app);
