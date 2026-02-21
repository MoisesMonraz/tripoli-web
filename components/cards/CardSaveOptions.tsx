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

const IconCheck = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/* ── contact info icons ── */
const IconWhatsApp = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
);

const IconLinkedIn = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const IconPhone = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconMail = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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
    const [walletLoading, setWalletLoading] = useState<"apple" | null>(null);
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

    /* ── contact info cells ── */
    const contactCellClass =
        "flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:shadow-sm active:scale-[0.97] dark:border-slate-700/70 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800/80";

    /* ── save button order ── */
    const buttonActions = [
        { key: "apple", label: "Apple Wallet", icon: <IconApple />, handler: handleAppleWallet, loading: walletLoading === "apple" },
        { key: "png", label: "Descargar imagen", icon: <IconImage />, handler: handleDownloadImage, loading: isExporting },
        { key: "copy", label: "Copiar info", icon: <IconCopy />, handler: handleCopy },
        { key: "vcf", label: "Guardar contacto", icon: <IconContact />, handler: handleSaveContact },
        { key: "share", label: "Compartir", icon: <IconShare />, handler: handleShare },
    ];

    const btnClass =
        "flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white/90 hover:shadow-md active:scale-[0.97] disabled:opacity-50 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/90";

    const renderButton = (action: typeof buttonActions[number], i: number) => (
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
    );

    return (
        <div className="relative mt-3">
            {/* ── 2×2 contact info grid ── */}
            <div className="grid grid-cols-2 gap-2">
                {/* top-left: WhatsApp */}
                {card.whatsapp && (
                    <a
                        href={`https://wa.me/${card.whatsapp.replace(/[\s+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={contactCellClass}
                    >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#25D36615", color: "#25D366" }}>
                            <IconWhatsApp />
                        </span>
                        <span className="truncate">WhatsApp</span>
                    </a>
                )}

                {/* top-right: LinkedIn */}
                {card.linkedin && (
                    <a
                        href={card.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={contactCellClass}
                    >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#0A66C215", color: "#0A66C2" }}>
                            <IconLinkedIn />
                        </span>
                        <span className="truncate">LinkedIn</span>
                    </a>
                )}

                {/* bottom-left: Phone */}
                <a
                    href={`tel:${card.phone.replace(/\s/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className={contactCellClass}
                >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                        <IconPhone />
                    </span>
                    <span className="truncate">{card.phone}</span>
                </a>

                {/* bottom-right: Email */}
                <a
                    href={`mailto:${card.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className={contactCellClass}
                >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                        <IconMail />
                    </span>
                    <span className="truncate">{card.email}</span>
                </a>
            </div>

            {/* divider between contact info and save buttons */}
            <div
                className="my-3 h-px w-full opacity-30"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                }}
            />

            {/* ── save action buttons grid ── */}
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: Apple Wallet | Descargar imagen */}
                {renderButton(buttonActions[0], 0)}
                {renderButton(buttonActions[1], 1)}

                {/* Row 2: Código QR (CardQR component) | Copiar info */}
                <CardQR card={card} accentColor={accentColor} />
                {renderButton(buttonActions[2], 3)}

                {/* Row 3: Guardar contacto | Compartir */}
                {renderButton(buttonActions[3], 4)}
                {renderButton(buttonActions[4], 5)}
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
