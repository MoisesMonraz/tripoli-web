"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLanguage } from "../LanguageProvider";

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

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AIChatWidget() {
  const { language } = useLanguage();
  const isEnglish = language === "EN";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fabTop, setFabTop] = useState(96);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const panelTop = fabTop + 56;

  const strings = useMemo(
    () => ({
      title: isEnglish ? "Tripoli Media Assistant" : "\u00a1Hola, soy Tripoli, tu asistente personal!",
      helper: isEnglish
        ? "Ask about Tripoli Media services, contact details, or categories."
        : "Preg\u00fantame sobre noticias, servicios, contacto y otros temas relacionados con Tripoli Media",
      placeholder: isEnglish ? "Ask about Tripoli Media..." : "Escribe tu pregunta",
      send: isEnglish ? "Send" : "Enviar",
      thinking: isEnglish ? "Thinking..." : "Pensando...",
      error: isEnglish ? "Sorry, something went wrong. Please try again." : "Lo siento, ocurri\u00f3 un error. Intenta de nuevo.",
      sources: isEnglish ? "Sources" : "Fuentes",
      ariaDialog: isEnglish ? "Tripoli Media Assistant" : "Asistente de Tripoli Media",
      ariaClose: isEnglish ? "Close chat" : "Cerrar chat",
      ariaOpen: isEnglish ? "Open Tripoli Media Assistant" : "Abrir asistente de Tripoli Media",
    }),
    [isEnglish]
  );

  const welcomeMessage = isEnglish
    ? "Hi, I'm Tripoli Bot - your virtual assistant to help you find exactly what you need!"
    : "\u00a1Hola! Soy Tripoli tu asistente virtual. Te ayudar\u00e9 a encontrar, de forma detallada, la informaci\u00f3n que necesitas.";

  const history = useMemo<ChatHistoryEntry[]>(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({ role: message.role, content: message.content }))
        .slice(-10),
    [messages]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "tripoli_bot_welcome_seen";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (!showWelcome) return;
    const timer = window.setTimeout(() => {
      setShowWelcome(false);
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [showWelcome]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const getTargetBottom = () => {
      const sticky = document.querySelector('[data-header="sticky"][data-visible="true"]') as HTMLElement | null;
      if (sticky) {
        return sticky.getBoundingClientRect().bottom;
      }

      const headerLine = document.querySelector('[data-header-line="main"]') as HTMLElement | null;
      if (headerLine) {
        return headerLine.getBoundingClientRect().bottom;
      }

      const mainHeader = document.querySelector('[data-header="main"]') as HTMLElement | null;
      if (mainHeader) {
        return mainHeader.getBoundingClientRect().bottom;
      }

      return 48;
    };

    let frame = 0;
    const update = () => {
      const bottom = getTargetBottom();
      setFabTop(Math.round(bottom + 48));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        update();
        frame = 0;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          lang: isEnglish ? "EN" : "ES",
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed.");
      }

      const data = (await response.json()) as { answer: string; sources?: Source[] };
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: strings.error,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        style={{ top: panelTop }}
        className={`fixed right-4 z-50 w-[340px] sm:w-[380px] max-h-[70vh] rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${
          isOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        }`}
        role="dialog"
        aria-label={strings.ariaDialog}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">{"\uD83E\uDD16"}</span>
              <div>
                <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-50">{strings.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={strings.ariaClose}
            >{"\u00d7"}</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                {strings.helper}
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-300">
                      <p className="font-semibold uppercase tracking-wide">{strings.sources}</p>
                      <ul className="space-y-1">
                        {message.sources.map((source) => (
                          <li key={`${message.id}-${source.url}`}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {strings.thinking}
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={strings.placeholder}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {strings.send}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-4 z-50" style={{ top: fabTop }}>
        {showWelcome && !isOpen ? (
          <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-x-[72px] -translate-y-1/2">
            <div
              className={`relative min-w-[280px] max-w-[360px] rounded-2xl border px-4 py-3 text-[11px] leading-relaxed shadow-lg whitespace-normal break-words ${
                isDarkMode
                  ? "border-slate-700 bg-slate-900 text-slate-100 shadow-black/40"
                  : "border-slate-200 bg-white text-slate-700 shadow-slate-900/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowWelcome(false)}
                className="pointer-events-auto absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={strings.ariaClose}
              >{"\u00d7"}</button>
              <p className="pr-4">{welcomeMessage}</p>
              <span
                className={`absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border ${
                  isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                }`}
                aria-hidden="true"
              />
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          setShowWelcome(false);
          setIsOpen((prev) => !prev);
        }}
        style={{ top: fabTop }}
        className="fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:bg-sky-600"
        aria-label={strings.ariaOpen}
      >{"\uD83E\uDD16"}</button>
    </>
  );
}
