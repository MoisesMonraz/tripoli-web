"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, useCallback } from "react";
import { useLanguage } from "../LanguageProvider";
import Image from "next/image";
import botIcon from "../../Imagenes/Logos/AIIcon.png";
import { useTurnstile } from "../security/useTurnstile";

// --- Types ---
type Source = {
  title: string;
  url: string;
  excerpt?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type ChatHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

// --- Utils ---
const createId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Converts plain text with URLs into JSX with clickable links
 */
const renderTextWithLinks = (text: string) => {
  // Regex to detect URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      // Ensure URL has protocol
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium"
        >
          {part}
        </a>
      );
    }
    // Regular text
    return <span key={index}>{part}</span>;
  });
};

// --- Hooks ---

/**
 * Manages the chat state, message history, and API communication.
 */
function useChatEngine(
  isEnglish: boolean,
  options?: {
    isCaptchaEnabled?: boolean;
    getCaptchaToken?: () => Promise<string | null>;
    resetCaptcha?: () => void;
  }
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isCaptchaEnabled, getCaptchaToken, resetCaptcha } = options || {};

  // Derived history for the API (last 10 messages)
  const history = useMemo<ChatHistoryEntry[]>(() => {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-10);
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };

      // Optimistic update
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        let captchaToken: string | null = null;
        if (isCaptchaEnabled && getCaptchaToken) {
          captchaToken = await getCaptchaToken();
          if (!captchaToken) {
            const errorMsg: ChatMessage = {
              id: createId(),
              role: "assistant",
              content: isEnglish
                ? "We could not verify your request. Please try again."
                : "No pudimos verificar tu solicitud. Inténtalo de nuevo.",
            };
            setMessages((prev) => [...prev, errorMsg]);
            setIsLoading(false);
            return;
          }
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history,
            lang: isEnglish ? "EN" : "ES",
            currentDate: new Date().toLocaleDateString(isEnglish ? "en-US" : "es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
            currentTime: new Date().toLocaleTimeString(isEnglish ? "en-US" : "es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: "h23" }) + " hrs",
            captchaToken,
          }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          const errorContent =
            data?.answer ||
            (isEnglish
              ? "Sorry, I'm having trouble right now. Please try again."
              : "Lo siento, tengo problemas en este momento. Inténtalo de nuevo.");
          const assistantMsg: ChatMessage = {
            id: createId(),
            role: "assistant",
            content: errorContent,
            sources: data?.sources || [],
          };
          setMessages((prev) => [...prev, assistantMsg]);
          return;
        }

        if (!data) {
          throw new Error("Empty API response.");
        }

        const assistantMsg: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: data.answer || (isEnglish ? "No answer received." : "No recibí respuesta."),
          sources: data.sources || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);
        resetCaptcha?.();
      } catch (error) {
        console.error("Chat error:", error);
        // Fallback error message
        const errorMsg: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: isEnglish
            ? "Sorry, I'm having trouble connecting right now. Please try again."
            : "Lo siento, tengo problemas de conexión en este momento. Inténtalo de nuevo.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [history, isEnglish]
  );

  return { messages, isLoading, sendMessage };
}

/**
 * Manages the floating button position relative to the footer/header.
 */
function useFloatingPosition() {
  const SM_BREAKPOINT = 640;

  const [fabTop, setFabTop] = useState(120);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const getTargetBottom = () => {
      // Priority 1: Sticky header (only when fully visible)
      const sticky = document.querySelector('[data-header="sticky"][data-visible="true"]');
      if (sticky) return sticky.getBoundingClientRect().bottom;

      // Priority 2: Header line
      const headerLine = document.querySelector('[data-header-line="main"]');
      if (headerLine) return headerLine.getBoundingClientRect().bottom;

      // Priority 3: Main header
      const mainHeader = document.querySelector('[data-header="main"]');
      if (mainHeader) return mainHeader.getBoundingClientRect().bottom;

      // Default
      return 48;
    };

    let frameId = 0;
    const updatePosition = () => {
      const bottom = getTargetBottom();
      const mobile = window.innerWidth < SM_BREAKPOINT;
      // Mobile: small gap (≤ icon height 44px). Desktop: larger gap.
      const offset = mobile ? 8 : 48;
      const minTop = mobile ? 64 : 120;
      setFabTop(Math.max(Math.round(bottom + offset), minTop));
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        updatePosition();
        frameId = 0;
      });
    };

    // Initial update
    updatePosition();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  return fabTop;
}

/**
 * Manages the welcome tooltip visibility.
 */
function useWelcomeTooltip(isOpen: boolean) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Only verify on client side
    if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      const key = "tripoli_bot_welcome_seen";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setShowWelcome(true);
      }
    }
  }, []);

  // Auto-hide after 45 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setShowWelcome(false), 45000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  // Hide when chat opens
  useEffect(() => {
    if (isOpen) setShowWelcome(false);
  }, [isOpen]);

  return { showWelcome, closeWelcome: () => setShowWelcome(false) };
}

/**
 * Detects dark mode changes.
 */
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains("dark"));

    // Initial check
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}

// --- Main Component ---

export default function AIChatWidget() {
  // 1. Context & State
  const { language } = useLanguage();
  const isEnglish = language === "EN";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    isEnabled: isCaptchaEnabled,
    getToken: getCaptchaToken,
    reset: resetCaptcha,
    containerRef: captchaContainerRef,
  } = useTurnstile();

  // 2. Custom Hooks (Logic Brain)
  const { messages, isLoading, sendMessage } = useChatEngine(isEnglish, {
    isCaptchaEnabled,
    getCaptchaToken,
    resetCaptcha,
  });
  const fabTop = useFloatingPosition();
  const { showWelcome, closeWelcome } = useWelcomeTooltip(isOpen);
  const isDarkMode = useDarkMode();

  // 3. UI Strings & Constants
  const strings = useMemo(
    () => ({
      title: isEnglish ? "Hi, I'm Tripoli, your personal assistant!" : "¡Hola, soy Tripoli, tu asistente personal!",
      helper: isEnglish
        ? "Ask me about news, services, contact, and other topics related to Tripoli Media."
        : "Pregúntame sobre noticias, servicios, contacto y otros temas relacionados con Tripoli Media",
      placeholder: isEnglish ? "Type your question" : "Escribe tu pregunta",
      send: isEnglish ? "Send" : "Enviar",
      thinking: isEnglish ? "Thinking..." : "Pensando...",
      sources: isEnglish ? "Sources" : "Fuentes",
      ariaDialog: isEnglish ? "Tripoli Media Assistant" : "Asistente de Tripoli Media",
      ariaClose: isEnglish ? "Close chat" : "Cerrar chat",
      ariaOpen: isEnglish ? "Open Tripoli Media Assistant" : "Abrir asistente de Tripoli Media",
    }),
    [isEnglish]
  );

  const welcomeMessage = isEnglish
    ? "Hi, I'm Tripoli Bot - your virtual assistant to help you find exactly what you need!"
    : <>¡Hola! Soy Tripoli tu asistente virtual.<br />Te ayudaré a encontrar, de forma detallada, la información que necesitas.</>;

  // 4. Effects (Auto-scroll)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // 5. Handlers
  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  // 6. JSX
  return (
    <>
      {isCaptchaEnabled ? (
        <div ref={captchaContainerRef} className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true" />
      ) : null}
      {/* Panel del Chat */}
      <div
        style={{
          top: fabTop,
          height: isOpen ? "500px" : "0",
          maxHeight: `calc(100vh - ${fabTop + 24}px)`
        }}
        className={`fixed right-2 sm:right-4 z-[45] w-[min(340px,calc(100vw-16px))] sm:w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col ${isOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          }`}
        role="dialog"
        aria-label={strings.ariaDialog}
      >
        {/* Header - Fixed Height */}
        <div className="flex h-[54px] sm:h-[60px] flex-shrink-0 items-center justify-between rounded-t-2xl tm-chat-header-animated px-3 sm:px-4 shadow-sm dark:border-b dark:border-slate-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center">
              <Image src={botIcon} alt="AI" width={32} height={32} className="brightness-0 invert h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight text-white antialiased">
                {strings.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 sm:p-2 text-white/80 transition hover:bg-white/20 hover:text-white text-xl sm:text-2xl"
            aria-label={strings.ariaClose}
          >
            ×
          </button>
        </div>

        {/* Message Area - Flexible & Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 tm-scrollbar">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-3 sm:py-4 text-[11px] sm:text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {strings.helper}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm ${message.role === "user"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {renderTextWithLinks(message.content)}
                </p>
                {/* Render sources if available */}
                {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {strings.sources}:
                    </span>
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline font-medium"
                      >
                        {source.title}{idx < (message.sources?.length ?? 0) - 1 ? "," : ""}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {strings.thinking}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer/Input - Fixed Height */}
        <div className="flex-shrink-0 border-t border-slate-200 p-2 sm:p-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={strings.placeholder}
              className="flex-1 rounded-xl border border-slate-200 bg-white h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-sky-500 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={strings.send}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 sm:h-5 sm:w-5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip de Bienvenida */}
      <div className="fixed right-2 sm:right-4 z-40 h-11 sm:h-12" style={{ top: fabTop }}>
        {showWelcome && !isOpen && (
          <div className="pointer-events-none absolute right-full top-1/2 mr-2 sm:mr-3 -translate-x-[48px] sm:-translate-x-[62px] -translate-y-1/2">
            <div
              className={`relative translate-x-[2.5px] sm:translate-x-0 min-w-0 sm:min-w-[280px] max-w-[min(280px,calc(100vw-96px))] sm:max-w-[320px] rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-[10.5px] sm:text-[11.5px] leading-relaxed shadow-lg whitespace-normal break-words ${isDarkMode
                ? "border-slate-700 bg-slate-900/75 text-slate-100 shadow-black/40"
                : "border-slate-200 bg-white/75 text-slate-700 shadow-slate-900/10"
                }`}
            >
              <button
                type="button"
                onClick={closeWelcome}
                className="pointer-events-auto absolute right-1.5 top-1/2 -translate-y-1/2 md:right-2 md:top-2 md:translate-y-0 rounded-full p-0.5 md:p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 text-lg md:text-xl"
                aria-label={strings.ariaClose}
              >
                ×
              </button>
              <div className="pr-3 sm:pr-4 text-left">
                <p className="block sm:hidden whitespace-nowrap">
                  {isEnglish ? "Hi, I'm Tripoli Bot - your assistant!" : "¡Hola! Soy Trípoli tu asistente virtual."}
                </p>
                <p className="hidden sm:block">
                  {welcomeMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón Flotante */}
      <button
        type="button"
        onClick={() => {
          closeWelcome();
          setIsOpen((prev) => !prev);
        }}
        style={{ top: fabTop }}
        className={`fixed right-2 sm:right-4 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all duration-300 hover:bg-sky-600 ${isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
          }`}
        aria-label={strings.ariaOpen}
      >
        <Image src={botIcon} alt="AI" width={32} height={32} className="brightness-0 invert h-6 w-6 sm:h-8 sm:w-8" />
      </button>

      <style jsx>{`
        .tm-chat-header-animated {
          background-image: linear-gradient(
            90deg,
            #c9e8fb,
            #9cd8f6,
            #6cc6f0,
            #36b3e8,
            #009fe3,
            #36b3e8,
            #6cc6f0,
            #9cd8f6,
            #c9e8fb
          );
          background-size: 300% 100%;
          animation: tmHeaderFlow 10s linear infinite;
        }
        @keyframes tmHeaderFlow {
          0% { background-position: 0% 0; }
          50% { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
        .tm-scrollbar::-webkit-scrollbar { width: 5px; }
        .tm-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .tm-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
          min-height: 100px;
        }
        .tm-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .dark .tm-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .tm-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </>
  );
}
