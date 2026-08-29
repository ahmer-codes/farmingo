import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "./env";

function resolvePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n");
}

let app: App;

function getFirebaseApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: resolvePrivateKey(env.FIREBASE_PRIVATE_KEY),
    }),
  });
  return app;
}

export const firebaseAdminApp = getFirebaseApp();
export const adminAuth = getAuth(firebaseAdminApp);
export const db = getFirestore(firebaseAdminApp);
