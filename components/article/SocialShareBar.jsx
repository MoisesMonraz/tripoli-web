"use client";

import { useState, useEffect } from "react";
import FavoriteButton from "./FavoriteButton";

/**
 * SocialShareBar - A professional social sharing bar component
 * Features: Facebook, X (Twitter), LinkedIn, Instagram/Share, Copy Link, Favorites
 * Style: Solid black icons with scale hover effect, no background boxes
 */
export default function SocialShareBar({ title, articleSlug, articleData }) {
    const [showToast, setShowToast] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        // Get the current URL on client side
        setCurrentUrl(window.location.href);
        // Check if Web Share API is available
        setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    }, []);

    const handleShare = async (platform) => {
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedTitle = encodeURIComponent(title || document.title);

        switch (platform) {
            case "facebook":
                window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                    "_blank",
                    "noopener,noreferrer,width=600,height=400"
                );
                break;
            case "twitter":
                window.open(
                    `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
                    "_blank",
                    "noopener,noreferrer,width=600,height=400"
                );
                break;
            case "linkedin":
                // Copy article URL to clipboard so it can be pasted in the company share dialog
                try { await navigator.clipboard.writeText(currentUrl); } catch {}
                window.open(
                    "https://www.linkedin.com/company/109624465/admin/page-posts/published/?share=true",
                    "_blank",
                    "noopener,noreferrer,width=900,height=700"
                );
                break;
            case "instagram":
                // Use Web Share API for mobile (Instagram Stories), fallback to Copy Link
                if (canShare) {
                    try {
                        await navigator.share({
                            title: title || document.title,
                            url: currentUrl,
                        });
                    } catch (err) {
                        // User cancelled or error - fallback to copy
                        if (err.name !== "AbortError") {
                            handleCopyLink();
                        }
                    }
                } else {
                    handleCopyLink();
                }
                break;
            default:
                break;
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }
    };

    // Base button styles: transparent bg, no border/outline, scale on hover
    const buttonClasses =
        "inline-flex items-center justify-center p-1 bg-transparent border-none outline-none shadow-none cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.15] focus:outline-none focus:ring-0 focus:shadow-none active:outline-none [-webkit-tap-highlight-color:transparent]";

    // Icon styles: solid black, with dark mode invert
    const iconClasses = "h-[18px] w-[18px] text-black dark:text-white";

    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Facebook */}
            <button
                onClick={() => handleShare("facebook")}
                className={buttonClasses}
                aria-label="Compartir en Facebook"
                title="Compartir en Facebook"
            >
                <svg
                    className={iconClasses}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            </button>

            {/* X (Twitter) */}
            <button
                onClick={() => handleShare("twitter")}
                className={buttonClasses}
                aria-label="Compartir en X"
                title="Compartir en X"
            >
                <svg
                    className={iconClasses}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </button>

            {/* LinkedIn */}
            <button
                onClick={() => handleShare("linkedin")}
                className={buttonClasses}
                aria-label="Compartir en LinkedIn"
                title="Compartir en LinkedIn"
            >
                <svg
                    className={iconClasses}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            </button>

            {/* Instagram / Share */}
            <button
                onClick={() => handleShare("instagram")}
                className={buttonClasses}
                aria-label={canShare ? "Compartir" : "Compartir en Instagram"}
                title={canShare ? "Compartir" : "Compartir en Instagram"}
            >
                <svg
                    className={iconClasses}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            </button>

            {/* Copy Link */}
            <button
                onClick={handleCopyLink}
                className={buttonClasses}
                aria-label="Copiar enlace"
                title="Copiar enlace"
            >
                <svg
                    className={iconClasses}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                </svg>
            </button>

            {/* Divider + Favorite Star */}
            {articleSlug && articleData && (
                <>
                    <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
                    <FavoriteButton articleSlug={articleSlug} articleData={articleData} />
                </>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform animate-fade-in">
                    <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                        ¡Enlace copiado!
                    </div>
                </div>
            )}
        </div>
    );
}
