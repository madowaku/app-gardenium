import { initializeApp, getApps, applicationDefault, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Firestore } from "@google-cloud/firestore";
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

function initializeAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const app = initializeApp({
    projectId: config.projectId,
    credential: applicationDefault(),
  });

  console.log(`Firebase Admin initialized for project: ${config.projectId}`);
  return app;
}

function initializeAdminDb(): Firestore {
  const databaseId =
    config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
      ? config.firestoreDatabaseId
      : "(default)";

  try {
    return new Firestore({
      projectId: config.projectId,
      databaseId,
    });
  } catch (error) {
    console.error("Firebase Admin Firestore initialization error", {
      projectId: config.projectId,
      databaseId,
      error,
    });
    throw error;
  }
}

export const adminApp = initializeAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = initializeAdminDb();
