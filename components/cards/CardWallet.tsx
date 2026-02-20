"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BusinessCard as BusinessCardType } from "@/data/cards";
import BusinessCard from "./BusinessCard";

interface CardWalletProps {
    cards: BusinessCardType[];
}

export default function CardWallet({ cards }: CardWalletProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    /* compute container height so the page knows how much space the stack needs */
    const baseHeight = cards.length * 68 + 60;
    const expandedExtraHeight = expandedIndex !== null ? 400 : 0;
    const containerHeight = baseHeight + expandedExtraHeight;

    return (
        <div className="mx-auto w-full max-w-[420px] px-4">
            {/* wallet title bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-6 flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00BFFF] to-[#0090cc] shadow-md shadow-sky-500/20">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {cards.length} tarjeta{cards.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {expandedIndex !== null && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setExpandedIndex(null)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80"
                    >
                        Cerrar
                    </motion.button>
                )}
            </motion.div>

            {/* stack container */}
            <motion.div
                className="relative w-full"
                animate={{ height: containerHeight }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ perspective: "1200px" }}
            >
                {cards.map((card, index) => (
                    <BusinessCard
                        key={card.id}
                        card={card}
                        isExpanded={expandedIndex === index}
                        onToggle={() => handleToggle(index)}
                        stackIndex={index}
                        totalCards={cards.length}
                        expandedIndex={expandedIndex}
                    />
                ))}
            </motion.div>

            {/* hint text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500"
            >
                Toca una tarjeta para ver los detalles
            </motion.p>
        </div>
    );
}
