"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "turnstile-script";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const loadScript = () =>
  new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.appendChild(script);
  });

export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingResolve = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled) return;
        if (!window.turnstile || !containerRef.current) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          size: "invisible",
          callback: (token: string) => {
            if (pendingResolve.current) {
              pendingResolve.current(token);
              pendingResolve.current = null;
            }
          },
        });
        setIsReady(true);
      })
      .catch(() => {
        setIsReady(false);
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // no-op
        }
      }
    };
  }, []);

  const getToken = useCallback(async () => {
    if (!SITE_KEY || !window.turnstile || !widgetIdRef.current) return null;
    return new Promise<string | null>((resolve) => {
      pendingResolve.current = resolve;
      try {
        window.turnstile.execute(widgetIdRef.current as string);
      } catch {
        pendingResolve.current = null;
        resolve(null);
      }
    });
  }, []);

  const reset = useCallback(() => {
    if (!SITE_KEY || !window.turnstile || !widgetIdRef.current) return;
    try {
      window.turnstile.reset(widgetIdRef.current as string);
    } catch {
      // no-op
    }
  }, []);

  return {
    isEnabled: Boolean(SITE_KEY),
    isReady,
    getToken,
    reset,
    containerRef,
  };
};

