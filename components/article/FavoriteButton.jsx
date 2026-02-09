"use client";

import { useFavorites } from "../favorites/FavoritesContext";

/**
 * FavoriteButton - Star icon for marking articles as favorites
 * Default: outline star with blue stroke
 * Favorited: solid filled star with blue fill
 */
export default function FavoriteButton({ articleSlug, articleData }) {
    const { isFavorite, toggleFavorite, isLoaded } = useFavorites();

    const isFav = isFavorite(articleSlug);

    const handleClick = () => {
        toggleFavorite({
            slug: articleSlug,
            ...articleData,
        });
    };

    // Don't render until favorites are loaded from localStorage
    if (!isLoaded) {
        return (
            <div className="h-[18px] w-[18px]" aria-hidden="true" />
        );
    }

    return (
        <button
            onClick={handleClick}
            className="inline-flex items-center justify-center p-1 bg-transparent border-none outline-none shadow-none cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.15] focus:outline-none focus:ring-0 focus:shadow-none active:outline-none [-webkit-tap-highlight-color:transparent]"
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
            <svg
                className="h-[18px] w-[18px] transition-all duration-300 ease-out"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill={isFav ? "#00BFFF" : "none"}
                stroke="#00BFFF"
                strokeWidth={isFav ? 0 : 2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
            </svg>
        </button>
    );
}
