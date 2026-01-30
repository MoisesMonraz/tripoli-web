"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import type { Analytics } from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let analytics: Analytics | undefined;
let firebaseClientReady = false;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseClientReady = true;
  } catch (error) {
    console.error("Failed to initialize Firebase client:", error);
    firebaseClientReady = false;
  }
} else if (typeof window !== "undefined" && !isFirebaseConfigured) {
  console.warn("Firebase client config is incomplete. Set NEXT_PUBLIC_FIREBASE_* env vars.");
}

const initAnalytics = () => {
  if (typeof window === "undefined" || !app) return undefined;
  if (!analytics) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn("Failed to initialize Firebase Analytics:", error);
      return undefined;
    }
  }
  return analytics;
};

export { app, auth, db, analytics, initAnalytics, isFirebaseConfigured, firebaseClientReady };
