import type { Metadata } from "next";
import CardWallet from "@/components/cards/CardWallet";
import { sampleCards } from "@/data/cards";

export const metadata: Metadata = {
    title: "Tarjetas Digitales",
    description:
        "Wallet de tarjetas de presentación digital del equipo de Tripoli Media.",
};

export default function TarjetasPage() {
    return (
        <main className="min-h-[70vh] py-10 sm:py-16">
            {/* heading */}
            <div className="mx-auto mb-10 max-w-[420px] px-4 text-center">
                <h1
                    className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
                    style={{ fontFamily: "'Raleway', system-ui, sans-serif" }}
                >
                    Tarjetas{" "}
                    <span className="bg-gradient-to-r from-[#00BFFF] to-[#0090cc] bg-clip-text text-transparent">
                        Digitales
                    </span>
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Tarjetas de presentación del equipo Tripoli Media
                </p>
            </div>

            {/* wallet */}
            <CardWallet cards={sampleCards} />
        </main>
    );
}
