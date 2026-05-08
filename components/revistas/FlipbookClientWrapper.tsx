"use client";

import dynamic from "next/dynamic";

const FlipbookViewer = dynamic(() => import("./FlipbookViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#152030]" style={{ height: "100dvh" }}>
      <div className="flex flex-col items-center gap-3 text-white/60">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#00BFFF]" />
        <span className="text-sm">Preparando revista…</span>
      </div>
    </div>
  ),
});

interface Props {
  pdfUrl: string;
  titulo: string;
}

export default function FlipbookClientWrapper(props: Props) {
  return <FlipbookViewer {...props} />;
}
