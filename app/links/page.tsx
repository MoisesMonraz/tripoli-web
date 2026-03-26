import Image from "next/image";
import * as Icons from "lucide-react";
import type { Metadata } from "next";
import logoSrc from "../../Imagenes/Logos/Tripoli Media Logo Sin Fondo.png";

export const metadata: Metadata = {
  title: "Tripoli Media — Links",
  description: "Noticias e inteligencia de negocios para México",
  openGraph: {
    title: "Tripoli Media — Links",
    description: "Noticias e inteligencia de negocios para México",
    url: "https://www.tripoli.media/links",
    siteName: "Tripoli Media",
    type: "website",
  },
};

export const revalidate = 60;

type LinkItem = {
  id: string;
  label: string;
  url: string;
  icon: string;
  order: number;
  active: boolean;
};

const FALLBACK_LINKS: LinkItem[] = [
  { id: "1", label: "Sitio web",          url: "https://www.tripoli.media",                       icon: "Globe",         order: 1, active: true },
  { id: "2", label: "WhatsApp",           url: "https://wa.me/523328175756",                      icon: "MessageCircle", order: 2, active: true },
  { id: "3", label: "Correo electrónico", url: "mailto:contacto@tripoli.media",                   icon: "Mail",          order: 3, active: true },
  { id: "4", label: "Facebook",           url: "https://www.facebook.com/TripoliMediaMX",         icon: "Facebook",      order: 4, active: true },
  { id: "5", label: "Instagram",          url: "https://www.instagram.com/tripoli.media/",        icon: "Instagram",     order: 5, active: true },
  { id: "6", label: "X (Twitter)",        url: "https://x.com/tripolimedia",                      icon: "Twitter",       order: 6, active: true },
  { id: "7", label: "LinkedIn",           url: "https://www.linkedin.com/company/tripoli-media",  icon: "Linkedin",      order: 7, active: true },
];

async function getLinks(): Promise<LinkItem[]> {
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getFirestore, collection, query, where, orderBy, getDocs } = await import("firebase/firestore");

    const cfg = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!cfg.apiKey || !cfg.projectId) return FALLBACK_LINKS;

    const app  = getApps().length ? getApp() : initializeApp(cfg);
    const db   = getFirestore(app);
    const snap = await getDocs(query(collection(db, "links"), where("active", "==", true), orderBy("order", "asc")));

    if (snap.empty) return FALLBACK_LINKS;

    return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<LinkItem, "id">) }));
  } catch {
    return FALLBACK_LINKS;
  }
}

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export default async function LinksPage() {
  const links = await getLinks();

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-[#F8FAFC] px-4 py-14">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-6">

        {/* Logo */}
        <Image
          src={logoSrc}
          alt="Tripoli Media"
          width={80}
          height={80}
          className="object-contain"
          priority
        />

        {/* Brand + tagline */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Tripoli Media</h1>
          <p className="text-sm text-[#6B7280]">
            Noticias e inteligencia de negocios para México
          </p>
        </div>

        {/* Link buttons */}
        <div className="flex w-full flex-col gap-3 mt-2">
          {links.map((link) => {
            const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[link.icon] ?? null;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center gap-3 w-full rounded-full
                  border-[1.5px] border-[#1E3A5F]
                  bg-white text-[#1E3A5F]
                  hover:bg-[#1E3A5F] hover:text-white
                  hover:scale-[1.02]
                  px-5 py-3 text-sm font-semibold
                  transition-all duration-200
                "
              >
                {IconComponent ? <IconComponent size={18} strokeWidth={1.8} /> : null}
                <span className="flex-1 text-center">{link.label}</span>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-xs text-[#9CA3AF]">
          © 2026 Tripoli Media
        </footer>
      </div>
    </main>
  );
}
