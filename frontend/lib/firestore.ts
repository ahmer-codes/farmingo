import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "~/lib/firebase";

let firestoreInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (!import.meta.client) {
    throw new Error("Firestore is only available in the browser");
  }
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
  }
  return firestoreInstance;
}
