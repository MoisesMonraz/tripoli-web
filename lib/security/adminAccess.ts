import "server-only";

type AdminRole = "owner" | "admin" | "editor" | "viewer";

type AdminUser = {
  email: string;
  role: AdminRole;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const parseRole = (value: string): AdminRole => {
  switch (value) {
    case "owner":
    case "admin":
    case "editor":
    case "viewer":
      return value;
    default:
      return "viewer";
  }
};

export const getAdminUsers = (): AdminUser[] => {
  const raw = process.env.ADMIN_USERS ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [emailPart, rolePart] = entry.split(":");
      const email = normalizeEmail(emailPart ?? "");
      if (!email) return null;
      const role = parseRole((rolePart ?? "viewer").trim());
      return { email, role };
    })
    .filter((item): item is AdminUser => Boolean(item));
};

export const getRoleForEmail = (email: string | null | undefined): AdminRole | null => {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  const admin = getAdminUsers().find((user) => user.email === normalized);
  return admin?.role ?? null;
};

export const isAdminEmail = (email: string | null | undefined): boolean =>
  Boolean(getRoleForEmail(email));

export type { AdminRole };

