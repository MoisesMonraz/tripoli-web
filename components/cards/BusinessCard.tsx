"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { BusinessCard as BusinessCardType } from "@/data/cards";
import CardSaveOptions from "./CardSaveOptions";

/* ── helpers ── */
function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function hexToRgb(hex: string) {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

/* ── icons (inline SVGs for zero deps) ── */
const IconMail = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const IconPhone = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconWhatsApp = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
);

const IconLinkedIn = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

/* ── component ── */
interface BusinessCardProps {
    card: BusinessCardType;
    isExpanded: boolean;
    onToggle: () => void;
    /** index position for stacked offset */
    stackIndex: number;
    totalCards: number;
    expandedIndex: number | null;
}

export default function BusinessCard({
    card,
    isExpanded,
    onToggle,
    stackIndex,
    totalCards,
    expandedIndex,
}: BusinessCardProps) {
    const { r, g, b } = hexToRgb(card.accentColor);
    const initials = getInitials(card.name);
    const cardRef = useRef<HTMLDivElement>(null);

    /* offset logic: cards below the expanded one push down */
    const isAnyExpanded = expandedIndex !== null;
    const isBelow = isAnyExpanded && expandedIndex !== null && stackIndex > expandedIndex;

    const stackOffset = isExpanded
        ? 0
        : isBelow
            ? stackIndex * 68 + 400
            : stackIndex * 68;

    return (
        <motion.div
            layout
            onClick={onToggle}
            className="absolute left-0 right-0 cursor-pointer"
            style={{ zIndex: isExpanded ? 50 : totalCards - stackIndex }}
            initial={false}
            animate={{
                y: stackOffset,
                rotateX: isExpanded ? 0 : 2,
                scale: isExpanded ? 1 : 1 - stackIndex * 0.02,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
        >
            <div
                ref={cardRef}
                className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-colors dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-black/20"
                style={{ perspective: "1200px" }}
            >
                {/* accent left stripe */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                    style={{
                        background: `linear-gradient(180deg, ${card.accentColor}, ${card.accentColor}88)`,
                    }}
                />

                {/* ── header section (always visible) ── */}
                <div className="flex items-center gap-3.5 px-5 py-4 pl-6">
                    {/* avatar */}
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                        style={{
                            background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}cc)`,
                            boxShadow: `0 4px 14px rgba(${r},${g},${b},0.35)`,
                        }}
                    >
                        {card.photo ? (
                            <img
                                src={card.photo}
                                alt={card.name}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    {/* name + position */}
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[0.95rem] font-bold leading-tight text-slate-900 dark:text-white">
                            {card.name}
                        </h3>
                        <p
                            className="mt-0.5 truncate text-xs font-semibold"
                            style={{ color: card.accentColor }}
                        >
                            {card.position}
                        </p>
                        <p className="mt-0.5 truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                            {card.department} · Tripoli Media
                        </p>
                    </div>

                    {/* expand indicator */}
                    <div className="shrink-0 text-slate-400 dark:text-slate-500">
                        <IconChevron open={isExpanded} />
                    </div>
                </div>

                {/* ── expanded detail section ── */}
                <motion.div
                    initial={false}
                    animate={{
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 34, mass: 0.7 }}
                    className="overflow-hidden"
                >
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3.5 pl-6 dark:border-slate-800">
                        {/* divider line with accent */}
                        <div
                            className="mb-3.5 h-px w-full"
                            style={{
                                background: `linear-gradient(90deg, ${card.accentColor}44, ${card.accentColor}, ${card.accentColor}44)`,
                            }}
                        />

                        {/* save / export options */}
                        <CardSaveOptions
                            card={card}
                            cardRef={cardRef}
                            accentColor={card.accentColor}
                        />

                        {/* accent glow at bottom */}
                        <div
                            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 opacity-[0.06]"
                            style={{
                                background: `linear-gradient(0deg, ${card.accentColor}, transparent)`,
                            }}
                        />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
