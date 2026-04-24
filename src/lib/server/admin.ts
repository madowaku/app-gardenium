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

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as FirebaseAppletConfig;
}

let dataApp = getApps().find(existingApp => existingApp.name === "[DEFAULT]");
let authApp: App | undefined;
let authProjectId: string | undefined;

if (!dataApp) {
  try {
    const config = loadFirebaseConfig();
    authProjectId =
      typeof config.authDomain === "string"
        ? config.authDomain.replace(".firebaseapp.com", "")
        : undefined;

    dataApp = initializeApp({
      projectId: config.projectId,
      credential: applicationDefault(),
    });

    console.log(`Firebase Admin initialized for project: ${config.projectId}`);
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
    dataApp = initializeApp({
      credential: applicationDefault(),
    });
  }
}

if (!authProjectId) {
  try {
    const config = loadFirebaseConfig();
    authProjectId =
      typeof config.authDomain === "string"
        ? config.authDomain.replace(".firebaseapp.com", "")
        : undefined;
  } catch {
    authProjectId = undefined;
  }
}

if (authProjectId && authProjectId !== dataApp!.options.projectId) {
  authApp = getApps().find(existingApp => existingApp.name === "auth-app");
  if (!authApp) {
    authApp = initializeApp(
      {
        projectId: authProjectId,
        credential: applicationDefault(),
      },
      "auth-app"
    );
  }
}

export const getAdminAuthForProject = (projectId?: string) => {
  if (!projectId) {
    return getAuth(authApp || dataApp!);
  }

  const existingApp =
    getApps().find(app => app.options.projectId === projectId) ||
    getApps().find(app => app.name === `auth-${projectId}`);

  if (existingApp) {
    return getAuth(existingApp);
  }

  const projectApp = initializeApp(
    {
      projectId,
      credential: applicationDefault(),
    },
    `auth-${projectId}`
  );

  return getAuth(projectApp);
};

export const adminAuth = getAuth(authApp || dataApp!);

// Use the specific Firestore database ID from config if present
const firestoreConfig = loadFirebaseConfig();
export const adminDb = firestoreConfig.firestoreDatabaseId
  ? getFirestore(dataApp!, firestoreConfig.firestoreDatabaseId)
  : getFirestore(dataApp!);
