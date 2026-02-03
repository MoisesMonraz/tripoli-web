"use server";

import { cookies } from "next/headers";
import { auth } from "../firebase/server";
import { verifyAdminSession, getAdminSessionCookieName } from "../security/adminSession";

export async function getRegisteredUsers() {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAdminSessionCookieName())?.value;
    const session = verifyAdminSession(token);

    if (!session) {
        return { ok: false, error: "Unauthorized" };
    }

    // Strict check: Session email must match ADMIN_EMAIL env var (or be in the list)
    const adminEmails = (process.env.ADMIN_EMAIL ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (!adminEmails.includes(session.email.toLowerCase())) {
        console.warn(`Access blocked for ${session.email}: Not in ADMIN_EMAIL list.`);
        return { ok: false, error: "Forbidden: Not in allowed admin list" };
    }

    if (!auth) {
        return { ok: false, error: "Firebase Auth not initialized" };
    }

    try {
        const listUsersResult = await auth.listUsers(100);

        // Sort by creation time desc
        const users = listUsersResult.users.sort((a, b) => {
            const dateA = new Date(a.metadata.creationTime).getTime();
            const dateB = new Date(b.metadata.creationTime).getTime();
            return dateB - dateA;
        });

        const leads = users.map((user) => ({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photo: user.photoURL,
            provider: user.providerData.map((p) => p.providerId).join(", "),
            createdAt: user.metadata.creationTime,
            lastLogin: user.metadata.lastSignInTime,
        }));

        return { ok: true, leads };
    } catch (error) {
        console.error("Failed to list users:", error);
        return { ok: false, error: "Failed to fetch users" };
    }
}
