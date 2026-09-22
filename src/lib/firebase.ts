import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firebase Authentication (real login — replaces the old hardcoded PIN/password)
export const auth = getAuth(app);

export const PROFILE_DOC_ID = "main_profile";

export interface CloudAppData {
  liquidBalance: number;
  investedAmount: number;
  transactions: any[];
  recurringExpenses: any[];
  connections: any[];
  whatsappConfig?: {
    phoneNumber: string;
    enabled: boolean;
    daysAhead: number;
  };
  lastUpdated?: string;
  resetBackupId?: string | null;
}

// Subscribe to real-time updates from Firestore cloud
export function subscribeCloudAppData(onData: (data: Partial<CloudAppData>) => void) {
  const docRef = doc(db, "appData", PROFILE_DOC_ID);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as CloudAppData);
      }
    },
    (error) => {
      console.warn("Firestore subscription warning:", error.message);
    }
  );
}

// Save complete app data to Firestore cloud
export async function saveCloudAppData(data: CloudAppData) {
  try {
    const docRef = doc(db, "appData", PROFILE_DOC_ID);
    await setDoc(docRef, {
      ...JSON.parse(JSON.stringify(data)),
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.error("Error saving data to Firestore:", err);
    return false;
  }
}

// Load initial app data from Firestore cloud
export async function loadCloudAppData(): Promise<CloudAppData | null> {
  try {
    const docRef = doc(db, "appData", PROFILE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CloudAppData;
    }
    return null;
  } catch (err: any) {
    console.error("Error loading data from Firestore:", err);
    return null;
  }
}
