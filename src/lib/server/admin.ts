import { initializeApp, getApps, applicationDefault, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

type FirebaseAppletConfig = {
  projectId?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
};

export function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as FirebaseAppletConfig;
}

const config = loadFirebaseConfig();
let defaultApp: App;

if (getApps().length === 0) {
  defaultApp = initializeApp({
    projectId: config.projectId,
    credential: applicationDefault(),
  });
  console.log(`Firebase Admin initialized for project: ${config.projectId}`);
} else {
  defaultApp = getApps()[0];
}

export const adminAuth = getAuth(defaultApp);

// Use the specific Firestore database ID from config if present
const databaseId = config.firestoreDatabaseId;
export const adminDb = databaseId && databaseId !== "(default)"
  ? getFirestore(defaultApp, databaseId)
  : getFirestore(defaultApp);
