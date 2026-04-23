import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let app = getApps()[0];

if (!app) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    app = initializeApp({
      projectId: config.projectId,
      credential: applicationDefault(),
    });

    console.log(`Firebase Admin initialized for project: ${config.projectId}`);
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);

    app = initializeApp({
      credential: applicationDefault(),
    });
  }
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);