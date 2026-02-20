"use client";

import { useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import type { BusinessCard } from "@/data/cards";

const BASE_URL = "https://tripoli.media/tarjetas";

interface CardQRProps {
    /** If provided, generates a QR for a specific card. Otherwise generates the master wallet QR. */
    card?: BusinessCard;
    accentColor?: string;
}

export default function CardQR({ card, accentColor = "#00BFFF" }: CardQRProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [showQR, setShowQR] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const url = card ? `${BASE_URL}?card=${card.id}` : BASE_URL;
    const label = card ? card.name : "Todas las tarjetas";

    const handleDownload = useCallback(async () => {
        if (!qrRef.current || downloading) return;
        setDownloading(true);
        try {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(qrRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#ffffff",
            });
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = card
                ? `QR_${card.name.replace(/\s+/g, "_")}.png`
                : "QR_Tripoli_Tarjetas.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("QR download failed:", err);
        } finally {
            setDownloading(false);
        }
    }, [card, downloading]);

    return (
        <>
            {/* trigger button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowQR(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white/90 hover:shadow-md active:scale-[0.97] dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/90"
            >
                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="3" height="3" />
                        <path d="M21 14h-3v3M21 21h-3v-3M18 21h3" />
                    </svg>
                </span>
                <span className="truncate">Código QR</span>
            </button>

            {/* QR modal overlay */}
            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowQR(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[320px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            {/* QR code container */}
                            <div
                                ref={qrRef}
                                className="mx-auto flex flex-col items-center rounded-xl bg-white p-5"
                            >
                                <QRCodeSVG
                                    value={url}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    level="M"
                                    includeMargin={false}
                                />
                                <p className="mt-3 text-center text-xs font-semibold text-slate-700">
                                    {label}
                                </p>
                                <p className="mt-0.5 text-center text-[0.65rem] text-slate-400">
                                    tripoli.media
                                </p>
                            </div>

                            {/* actions */}
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload();
                                    }}
                                    disabled={downloading}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    {downloading ? (
                                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    )}
                                    Descargar PNG
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowQR(false);
                                    }}
                                    className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
