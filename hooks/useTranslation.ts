"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../components/LanguageProvider";

// Client-side cache for translations (persists during session)
const clientCache = new Map<string, string>();

// Batch queue for optimizing API calls
let batchQueue: { text: string; resolve: (value: string) => void }[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

const processBatch = async () => {
    if (batchQueue.length === 0) return;

    const currentBatch = [...batchQueue];
    batchQueue = [];

    const textsToTranslate = currentBatch.map(item => item.text);

    try {
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: textsToTranslate, targetLang: "EN" }),
        });

        if (!response.ok) {
            // On error, resolve with original texts
            currentBatch.forEach(item => {
                item.resolve(item.text);
            });
            return;
        }

        const data = await response.json();
        const translations = data.translations || [];

        currentBatch.forEach((item, index) => {
            const translation = translations[index] || item.text;
            // Cache the result
            clientCache.set(item.text, translation);
            item.resolve(translation);
        });
    } catch (error) {
        console.error("Translation batch error:", error);
        currentBatch.forEach(item => {
            item.resolve(item.text);
        });
    }
};

const queueTranslation = (text: string): Promise<string> => {
    // Check cache first
    const cached = clientCache.get(text);
    if (cached) {
        return Promise.resolve(cached);
    }

    return new Promise((resolve) => {
        batchQueue.push({ text, resolve });

        // Debounce to batch multiple translations
        if (batchTimeout) {
            clearTimeout(batchTimeout);
        }
        batchTimeout = setTimeout(() => {
            batchTimeout = null;
            processBatch();
        }, 100); // Wait 100ms to collect more translations
    });
};

/**
 * Hook to translate a single text to English when EN language is selected
 * Returns the original text if language is ES, or translated text if EN
 */
export function useTranslatedText(originalText: string): string {
    const { language } = useLanguage();
    const [translatedText, setTranslatedText] = useState(originalText);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (language === "ES" || !originalText) {
            setTranslatedText(originalText);
            return;
        }

        // Check client cache
        const cached = clientCache.get(originalText);
        if (cached) {
            setTranslatedText(cached);
            return;
        }

        // Queue translation
        queueTranslation(originalText).then((result) => {
            if (mountedRef.current) {
                setTranslatedText(result);
            }
        });
    }, [originalText, language]);

    return language === "ES" ? originalText : translatedText;
}

/**
 * Hook to translate multiple texts at once (more efficient)
 * Returns an array of translated texts
 */
export function useTranslatedTexts(originalTexts: string[]): string[] {
    const { language } = useLanguage();
    const [translatedTexts, setTranslatedTexts] = useState<string[]>(originalTexts);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (language === "ES" || originalTexts.length === 0) {
            setTranslatedTexts(originalTexts);
            return;
        }

        // Queue all translations
        Promise.all(originalTexts.map(text => queueTranslation(text))).then((results) => {
            if (mountedRef.current) {
                setTranslatedTexts(results);
            }
        });
    }, [originalTexts.join("|||"), language]);

    return language === "ES" ? originalTexts : translatedTexts;
}

/**
 * Simple function to get translation imperatively (for non-hook contexts)
 */
export async function translateText(text: string): Promise<string> {
    return queueTranslation(text);
}
