import "server-only";
import crypto from "crypto";
import type { AdminRole } from "./adminAccess";

type AdminSessionPayload = {
  uid: string;
  email: string;
  role: AdminRole;
  exp: number;
};

const COOKIE_NAME = "tripoli_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const getSecret = () =>
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "";

const base64UrlEncode = (input: Buffer | string) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (input: string) => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
};

const sign = (payload: string, secret: string) =>
  base64UrlEncode(crypto.createHmac("sha256", secret).update(payload).digest());

export const createAdminSession = (data: Omit<AdminSessionPayload, "exp">) => {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: AdminSessionPayload = { ...data, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifyAdminSession = (token: string | null | undefined): AdminSessionPayload | null => {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload, secret);
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getAdminSessionCookieName = () => COOKIE_NAME;
export const getAdminSessionTtlSeconds = () => SESSION_TTL_SECONDS;
export type { AdminSessionPayload };
