"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tripoli-favorites";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load favorites from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever favorites change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
            } catch (error) {
                console.error("Error saving favorites:", error);
            }
        }
    }, [favorites, isLoaded]);

    const addFavorite = useCallback((articleData) => {
        setFavorites((prev) => {
            // Don't add if already exists
            if (prev.some((f) => f.slug === articleData.slug)) {
                return prev;
            }
            return [...prev, { ...articleData, savedAt: new Date().toISOString() }];
        });
    }, []);

    const removeFavorite = useCallback((slug) => {
        setFavorites((prev) => prev.filter((f) => f.slug !== slug));
    }, []);

    const isFavorite = useCallback(
        (slug) => favorites.some((f) => f.slug === slug),
        [favorites]
    );

    const toggleFavorite = useCallback(
        (articleData) => {
            if (isFavorite(articleData.slug)) {
                removeFavorite(articleData.slug);
            } else {
                addFavorite(articleData);
            }
        },
        [isFavorite, removeFavorite, addFavorite]
    );

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite,
                removeFavorite,
                isFavorite,
                toggleFavorite,
                isLoaded,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
}
