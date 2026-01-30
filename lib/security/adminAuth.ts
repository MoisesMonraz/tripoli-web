import "server-only";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../firebase/server";
import { getRoleForEmail, type AdminRole } from "./adminAccess";

type VerifiedAdmin = {
  uid: string;
  email: string;
  role: AdminRole;
};

export const getAdminDb = () => db;

export const verifyAdminIdToken = async (idToken: string): Promise<VerifiedAdmin> => {
  if (!app) {
    throw new Error("Firebase Admin SDK not initialized.");
  }
  const auth = getAuth(app);
  const decoded = await auth.verifyIdToken(idToken);
  const email = decoded.email ?? "";
  const role = getRoleForEmail(email);
  if (!email || !role) {
    throw new Error("Admin access denied.");
  }
  return {
    uid: decoded.uid,
    email,
    role,
  };
};

