"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BusinessCard } from "@/data/cards";
import {
    downloadVCard,
    downloadCardAsImage,
    copyContactInfo,
    shareCard,
} from "@/utils/cardExport";
import CardQR from "./CardQR";

/* ── inline icons ── */
const IconContact = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
    </svg>
);

const IconImage = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const IconCopy = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const IconShare = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const IconApple = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

const IconGoogle = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const IconCheck = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/* ── feedback toast types ── */
type FeedbackType = "copied" | "saved" | "shared" | "downloaded" | "wallet-fallback" | null;

const feedbackLabels: Record<NonNullable<FeedbackType>, string> = {
    copied: "¡Copiado!",
    saved: "¡Contacto guardado!",
    shared: "¡Compartido!",
    downloaded: "¡Imagen descargada!",
    "wallet-fallback": "Wallet no disponible — vCard descargado",
};

/* ── component ── */
interface CardSaveOptionsProps {
    card: BusinessCard;
    /** ref to the card DOM element for image export */
    cardRef: React.RefObject<HTMLElement | null>;
    accentColor: string;
}

export default function CardSaveOptions({
    card,
    cardRef,
    accentColor,
}: CardSaveOptionsProps) {
    const [feedback, setFeedback] = useState<FeedbackType>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [walletLoading, setWalletLoading] = useState<"apple" | "google" | null>(null);
    const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const showFeedback = (type: NonNullable<FeedbackType>) => {
        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
        setFeedback(type);
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 2500);
    };

    const handleSaveContact = (e: React.MouseEvent) => {
        e.stopPropagation();
        downloadVCard(card);
        showFeedback("saved");
    };

    const handleDownloadImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cardRef.current || isExporting) return;
        setIsExporting(true);
        try {
            await downloadCardAsImage(cardRef.current, card);
            showFeedback("downloaded");
        } catch (err) {
            console.error("Image export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await copyContactInfo(card);
        if (success) showFeedback("copied");
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await shareCard(card);
        if (success) showFeedback("shared");
    };

    const handleAppleWallet = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (walletLoading) return;
        setWalletLoading("apple");
        try {
            const res = await fetch(`/api/cards/pass/${card.id}`);
            if (res.ok) {
                // If pass is generated, download it
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${card.name.replace(/\s+/g, "_")}.pkpass`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showFeedback("saved");
            } else {
                // Fallback: download vCard instead
                downloadVCard(card);
                showFeedback("wallet-fallback");
            }
        } catch {
            downloadVCard(card);
            showFeedback("wallet-fallback");
        } finally {
            setWalletLoading(null);
        }
    };

    const handleGoogleWallet = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (walletLoading) return;
        setWalletLoading("google");
        try {
            const res = await fetch(`/api/cards/google-pass/${card.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.open(data.url, "_blank", "noopener,noreferrer");
                    showFeedback("saved");
                } else {
                    downloadVCard(card);
                    showFeedback("wallet-fallback");
                }
            } else {
                downloadVCard(card);
                showFeedback("wallet-fallback");
            }
        } catch {
            downloadVCard(card);
            showFeedback("wallet-fallback");
        } finally {
            setWalletLoading(null);
        }
    };

    const primaryActions = [
        { key: "vcf", label: "Guardar contacto", icon: <IconContact />, handler: handleSaveContact },
        { key: "png", label: "Descargar imagen", icon: <IconImage />, handler: handleDownloadImage, loading: isExporting },
        { key: "copy", label: "Copiar info", icon: <IconCopy />, handler: handleCopy },
        { key: "share", label: "Compartir", icon: <IconShare />, handler: handleShare },
    ];

    const walletActions = [
        { key: "apple", label: "Apple Wallet", icon: <IconApple />, handler: handleAppleWallet, loading: walletLoading === "apple" },
        { key: "google", label: "Google Wallet", icon: <IconGoogle />, handler: handleGoogleWallet, loading: walletLoading === "google" },
    ];

    const btnClass =
        "flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white/90 hover:shadow-md active:scale-[0.97] disabled:opacity-50 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/90";

    return (
        <div className="relative mt-3">
            {/* divider */}
            <div
                className="mb-3 h-px w-full opacity-30"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
            />

            {/* primary action buttons grid */}
            <div className="grid grid-cols-2 gap-2">
                {primaryActions.map((action, i) => (
                    <motion.button
                        key={action.key}
                        type="button"
                        onClick={action.handler}
                        disabled={action.loading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.25 }}
                        className={btnClass}
                    >
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: `${accentColor}15`,
                                color: accentColor,
                            }}
                        >
                            {action.loading ? (
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                </svg>
                            ) : (
                                action.icon
                            )}
                        </span>
                        <span className="truncate">{action.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* wallet + QR section */}
            <div
                className="mt-2 mb-1 h-px w-full opacity-20"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
                {/* QR button (opens modal) */}
                <CardQR card={card} accentColor={accentColor} />

                {/* Wallet buttons */}
                {walletActions.map((action, i) => (
                    <motion.button
                        key={action.key}
                        type="button"
                        onClick={action.handler}
                        disabled={action.loading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * (i + 5), duration: 0.25 }}
                        className={btnClass}
                    >
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: `${accentColor}15`,
                                color: accentColor,
                            }}
                        >
                            {action.loading ? (
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                </svg>
                            ) : (
                                action.icon
                            )}
                        </span>
                        <span className="truncate">{action.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* feedback toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-lg whitespace-nowrap"
                        style={{
                            backgroundColor: feedback === "wallet-fallback" ? "#f59e0b" : accentColor,
                            borderColor: feedback === "wallet-fallback" ? "#f59e0b" : accentColor,
                            color: "#ffffff",
                        }}
                    >
                        <IconCheck />
                        {feedbackLabels[feedback]}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
