"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "./client";

type IpLocationPayload = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  source?: string;
};

type GuestLeadInput = {
  email: string;
  ipLocation?: IpLocationPayload | null;
  captchaToken?: string | null;
};

type RegisterResult = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

const ensureFirebaseReady = () => {
  if (!auth || !db) {
    throw new Error("Firebase client is not initialized.");
  }
  return { auth, db };
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const signInWithGoogleAndRegister = async (): Promise<RegisterResult> => {
  const { auth, db } = ensureFirebaseReady();

  await setPersistence(auth, browserLocalPersistence);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  if (!user.email) {
    throw new Error("Google account did not provide an email.");
  }

  const userRef = doc(db, "registered_users_db", user.uid);
  const snapshot = await getDoc(userRef);

  const payload: Record<string, unknown> = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    lastLogin: serverTimestamp(),
    marketingConsent: true,
    accountStatus: "active",
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(userRef, payload, { merge: true });

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

export const saveGuestLead = async ({ email, ipLocation, captchaToken }: GuestLeadInput) => {
  const response = await fetch("/api/access-gate/guest-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalizeEmail(email),
      ipLocation: ipLocation ?? null,
      captchaToken: captchaToken ?? null,
    }),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error || "No pudimos completar el registro como invitado.";
    throw new Error(message);
  }

  return data?.id ?? "";
};

export type { GuestLeadInput, IpLocationPayload, RegisterResult };
