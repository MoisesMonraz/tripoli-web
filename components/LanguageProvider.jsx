"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("ES");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("tm-language") : null;
    if (stored === "EN" || stored === "ES") setLanguage(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    localStorage.setItem("tm-language", language);
    document.documentElement.setAttribute("lang", language === "EN" ? "en" : "es");
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
