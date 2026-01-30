import "server-only";

type TurnstileResult = {
  ok: boolean;
  error?: string;
};

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? "";

export const isTurnstileEnabled = () => Boolean(TURNSTILE_SECRET_KEY);

export const verifyTurnstileToken = async (
  token: string | null | undefined,
  ip?: string | null
): Promise<TurnstileResult> => {
  if (!TURNSTILE_SECRET_KEY) return { ok: true };
  if (!token) return { ok: false, error: "missing-token" };

  try {
    const body = new URLSearchParams();
    body.set("secret", TURNSTILE_SECRET_KEY);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      return { ok: false, error: "verification-failed" };
    }

    const data = (await response.json()) as { success?: boolean; ["error-codes"]?: string[] };
    if (!data?.success) {
      return { ok: false, error: data?.["error-codes"]?.[0] ?? "invalid-token" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "verification-error" };
  }
};

