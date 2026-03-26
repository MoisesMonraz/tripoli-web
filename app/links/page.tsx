import Image from "next/image";
import * as Icons from "lucide-react";
import type { Metadata } from "next";
import logoSrc from "../../Imagenes/Logos/Tripoli Media Logo Sin Fondo.png";
import { db } from "../../lib/firebase/server";

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
    if (!db) return FALLBACK_LINKS;

    const snap = await db.collection("links").orderBy("order", "asc").get();
    if (snap.empty) return FALLBACK_LINKS;

    const links = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<LinkItem, "id">) }))
      .filter((link) => link.active);

    return links.length > 0 ? links : FALLBACK_LINKS;
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

        {/* Logo + Title + Tagline */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <Image
              src={logoSrc}
              alt="Tripoli Media"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
            <h1 className="text-base font-semibold tracking-[0.12em] uppercase text-[#009FE3]">
              Tripoli Media
            </h1>
          </div>
          <p className="text-sm text-[#6B7280]">
            ¡Contáctanos y síguenos en nuestras redes sociales!
          </p>
        </div>

        {/* Link buttons — all same width (widest item) */}
        <div className="flex flex-col gap-3 mt-2 w-fit mx-auto">
          {links.map((link) => {
            const iconMap = Icons as unknown as Record<string, LucideIcon>;
            const IconComponent = iconMap[link.icon] ?? iconMap['Link'];
            const isNative = link.url.startsWith('tel:') || link.url.startsWith('mailto:');
            return (
              <a
                key={link.id}
                href={link.url}
                {...(!isNative && { target: '_blank', rel: 'noopener noreferrer' })}
                className="
                  flex items-center gap-3 rounded-full
                  border-[1.5px] border-[#009FE3]
                  bg-white text-[#009FE3]
                  hover:bg-[#009FE3] hover:text-white
                  hover:scale-[1.02]
                  px-6 py-3 text-sm font-semibold
                  transition-all duration-200
                "
              >
                {IconComponent ? <IconComponent size={18} strokeWidth={1.8} /> : null}
                <span>{link.label}</span>
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
