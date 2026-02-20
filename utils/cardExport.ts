import type { BusinessCard } from "@/data/cards";

/* ═══════════════════════════════════════════════════════════════
   1. vCard (.vcf) generation & download
   ═══════════════════════════════════════════════════════════════ */

function buildVCardString(card: BusinessCard): string {
    const nameParts = card.name.split(" ");
    // Assume last word is family name, rest are given names
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const givenName = nameParts.length > 1
        ? nameParts.slice(0, -1).join(" ")
        : nameParts[0] || "";

    const lines: string[] = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${familyName};${givenName};;;`,
        `FN:${card.name}`,
        `ORG:Tripoli Media`,
        `TITLE:${card.position}`,
        `TEL;TYPE=WORK,VOICE:${card.phone.replace(/\s/g, "")}`,
        `EMAIL;TYPE=WORK:${card.email}`,
        `URL:https://tripoli.media`,
    ];

    if (card.whatsapp) {
        lines.push(`TEL;TYPE=CELL:${card.whatsapp.replace(/\s/g, "")}`);
    }

    if (card.linkedin) {
        lines.push(`URL;TYPE=WORK:${card.linkedin}`);
    }

    if (card.department) {
        lines.push(`NOTE:Departamento: ${card.department}`);
    }

    lines.push("END:VCARD");
    return lines.join("\r\n");
}

export function downloadVCard(card: BusinessCard): void {
    const vcf = buildVCardString(card);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   2. Export card as PNG image
   ═══════════════════════════════════════════════════════════════ */

export async function downloadCardAsImage(
    cardElement: HTMLElement,
    card: BusinessCard
): Promise<void> {
    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(cardElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${card.name.replace(/\s+/g, "_")}_tarjeta.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* ═══════════════════════════════════════════════════════════════
   3. Copy contact info to clipboard
   ═══════════════════════════════════════════════════════════════ */

function formatContactText(card: BusinessCard): string {
    const lines: string[] = [
        card.name,
        `${card.position} — ${card.department}`,
        `Tripoli Media`,
        "",
        `📧 ${card.email}`,
        `📞 ${card.phone}`,
    ];

    if (card.whatsapp) lines.push(`💬 WhatsApp: ${card.whatsapp}`);
    if (card.linkedin) lines.push(`🔗 ${card.linkedin}`);
    lines.push("🌐 tripoli.media");

    return lines.join("\n");
}

export async function copyContactInfo(card: BusinessCard): Promise<boolean> {
    const text = formatContactText(card);
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers / insecure contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
   4. Web Share API (with clipboard fallback)
   ═══════════════════════════════════════════════════════════════ */

export async function shareCard(card: BusinessCard): Promise<boolean> {
    const text = formatContactText(card);
    const title = `${card.name} — Tripoli Media`;

    if (typeof navigator !== "undefined" && navigator.share) {
        try {
            await navigator.share({ title, text });
            return true;
        } catch (err: unknown) {
            // User cancelled share — not an error
            if (err instanceof Error && err.name === "AbortError") return false;
            // Fallback to clipboard
        }
    }

    // Fallback: copy to clipboard
    return copyContactInfo(card);
}
