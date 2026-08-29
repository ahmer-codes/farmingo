import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

function getFirebaseConfig() {
  const config = useRuntimeConfig();
  return {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  if (getApps().length > 0) {
    firebaseApp = getApp();
    return firebaseApp;
  }
  firebaseApp = initializeApp(getFirebaseConfig());
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth;
  firebaseAuth = getAuth(getFirebaseApp());
  if (import.meta.client) {
    setPersistence(firebaseAuth, browserLocalPersistence).catch(
      () => undefined,
    );
  }
  return firebaseAuth;
}

export type { FirebaseUser };

export function waitForAuthReady(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth();
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

export async function getFirebaseIdToken(
  forceRefresh = false,
): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
