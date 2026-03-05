import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    getAuthorBySlugFromContentful,
    getArticlesByAuthorSlug,
    getAllAuthorSlugs,
} from "@/lib/contentful";
import { getAuthorBySlug } from "@/lib/authors";

// ─── Static paths ─────────────────────────────────────────────────────────────
export async function generateStaticParams() {
    const slugs = await getAllAuthorSlugs();
    // Filter out the old slug and add the new one
    const filteredSlugs = slugs.filter(s => s !== "moises-monraz");
    if (!filteredSlugs.includes("moises-monraz-escoto")) {
        filteredSlugs.push("moises-monraz-escoto");
    }
    return filteredSlugs.map((slug: string) => ({ authorSlug: slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ authorSlug: string }>;
}) {
    const { authorSlug } = await params;

    // Slug aliasing: moises-monraz-escoto -> moises-monraz
    const effectiveSlug = authorSlug === "moises-monraz-escoto" ? "moises-monraz" : authorSlug;

    const author = await getAuthorBySlugFromContentful(effectiveSlug);
    if (!author) return {};

    // Name override
    let name = author.name;
    if (author.name === "Moisés Monraz" || authorSlug === "moises-monraz-escoto") {
        name = "Moisés Monraz Escoto";
    }

    return {
        title: `${name} | Tripoli Media`,
        description: author.bio,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateInput: string | undefined) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })
        .format(d)
        .toLowerCase();
};

const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23718096' font-family='Arial, sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AuthorPage({
    params,
}: {
    params: Promise<{ authorSlug: string }>;
}) {
    const { authorSlug } = await params;

    // Explicitly 404 the old slug
    if (authorSlug === "moises-monraz") notFound();

    // Slug aliasing: moises-monraz-escoto -> moises-monraz
    // (In case Contentful still uses the old slug)
    const effectiveSlug = authorSlug === "moises-monraz-escoto" ? "moises-monraz" : authorSlug;

    const author = await getAuthorBySlugFromContentful(effectiveSlug);
    if (!author) notFound();

    // Merge with specialAuthor data if available
    const specialAuthor = getAuthorBySlug(effectiveSlug);
    const role = specialAuthor?.role || author.role;
    const bio = specialAuthor?.bio || author.bio;

    const articles = await getArticlesByAuthorSlug(effectiveSlug);

    // Manual override for spelling: Camila -> Cámila, Sofia -> Sofía, Moisés -> Moisés Monraz Escoto
    let displayName = author.name;
    if (author.name === "Camila Aceves") displayName = "Cámila Aceves";
    if (author.name === "Sofia Pelayo") displayName = "Sofía Pelayo";
    if (author.name === "Moisés Monraz" || authorSlug === "moises-monraz-escoto") {
        displayName = "Moisés Monraz Escoto";
    }

    // Theme colors based on author/department
    const isCamila = authorSlug === "camila-aceves";
    const isManuela = authorSlug === "manuela-piza-hernandez";
    const isIzco = authorSlug === "izcoatl-sanchez-patino";
    const isPablo = authorSlug === "pablo-diaz-del-castillo";
    const isEmiliano = authorSlug === "emiliano-mendez-alonso";
    const isSofia = authorSlug === "sofia-pelayo" || authorSlug === "sofia-pelayo-romo";
    const isMoises = authorSlug === "moises-monraz-escoto";
    const isIgnacio = authorSlug === "juan-ignacio-armenta";
    const isRicardo = authorSlug === "ricardo-nunez-esparza";

    let brandColor = "#009fe3";
    let brandGradient = "linear-gradient(90deg, #009fe3, #83d0f5, #009fe3)";

    if (isCamila) {
        brandColor = "#f39200";
        brandGradient = "linear-gradient(90deg, #f39200, #fdc652, #fee5c8)";
    } else if (isManuela) {
        brandColor = "#009640";
        brandGradient = "linear-gradient(90deg, #009640, #cce5ce, #009640)";
    } else if (isIzco) {
        brandColor = "#0069b4";
        brandGradient = "linear-gradient(90deg, #0069b4, #c8d5ef, #0069b4)";
    } else if (isPablo) {
        brandColor = "#5d514c";
        brandGradient = "linear-gradient(90deg, #5d514c, #958b87, #d8d4d3)";
    } else if (isEmiliano) {
        brandColor = "#312783";
        brandGradient = "linear-gradient(90deg, #312783, #9185be, #c8c1e1)";
    } else if (isSofia) {
        brandColor = "#e6007e";
        brandGradient = "linear-gradient(90deg, #e6007e, #f29fc5, #f9d3e6)";
    } else if (isMoises) {
        brandColor = "#8fabb6";
        brandGradient = "linear-gradient(90deg, #8fabb6, #cad4da, #e5e9ed)";
    } else if (isIgnacio) {
        brandColor = "#009a93";
        brandGradient = "linear-gradient(90deg, #009a93, #009a93, #cbe7e5)";
    } else if (isRicardo) {
        brandColor = "#951b81";
        brandGradient = "linear-gradient(90deg, #951b81, #c693c2, #e1cae3)";
    }

    // Initials fallback for when no photo is available
    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <main className="flex flex-col pb-20 pt-8">

            {/* ── SECTION A: Author profile ───────────────────────────────────────── */}
            <div className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4">
                <div className="flex flex-row items-stretch gap-4">
                    {/* Photo — separate card */}
                    <div className="relative w-[172.5px] aspect-[3/4] flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-200 shadow-md shadow-slate-900/5 dark:border-slate-800/70 dark:bg-slate-800">
                        <Image
                            src={author.photoUrl}
                            alt={`Foto de ${displayName}`}
                            fill
                            className="object-cover object-top"
                            sizes="172.5px"
                        />
                        {/* Initials fallback — behind photo */}
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-400 dark:text-slate-500 select-none"
                            style={{ zIndex: -1 }}
                        >
                            {initials}
                        </div>
                    </div>

                    {/* Info — separate card */}
                    <div className="flex flex-1 flex-col justify-center gap-2 p-3 pr-6 overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 dark:border-slate-800/70 dark:bg-slate-900/70">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {displayName}
                        </h1>
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                            {role}
                        </p>
                        {bio && (
                            <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[90%]">
                                {bio}
                            </p>
                        )}

                        {/* Social links (only shown if defined) */}
                        {author.social && (
                            <div className="flex gap-4 mt-1">
                                {author.social.twitter && (
                                    <a
                                        href={`https://twitter.com/${author.social.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-semibold text-[#009fe3] hover:underline"
                                    >
                                        Twitter
                                    </a>
                                )}
                                {author.social.linkedin && (
                                    <a
                                        href={`https://linkedin.com/in/${author.social.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-semibold text-[#009fe3] hover:underline"
                                    >
                                        LinkedIn
                                    </a>
                                )}
                                {author.social.instagram && (
                                    <a
                                        href={`https://instagram.com/${author.social.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-semibold hover:underline"
                                        style={{ color: brandColor }}
                                    >
                                        Instagram
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── SECTION B: Articles list ────────────────────────────────────────── */}
            <div className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4 pt-8">
                <section className="flex flex-col gap-6">
                    {/* Section heading — same style as subcategory pages */}
                    <div className="flex items-center gap-3">
                        <span
                            className="h-[44px] w-[8px] rounded-sm flex-shrink-0"
                            style={{ background: brandColor }}
                            aria-hidden="true"
                        />
                        <h2
                            className="text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em]"
                            style={{ color: brandColor }}
                        >
                            Artículos de {displayName}
                        </h2>
                        <div
                            className="h-[44px] flex-1 rounded-sm"
                            style={{
                                background: brandGradient,
                                backgroundSize: "300% 100%",
                                animation: "subcatGradMove 12s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                        />
                    </div>

                    {/* Articles */}
                    {articles.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">
                            No hay artículos publicados aún.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {articles.map((post: any) => {
                                const articleHref =
                                    post.category && post.subcategory
                                        ? `/${post.category}/${post.subcategory}/articulo/${post.slug}`
                                        : `/articulo/${post.slug}`;
                                const formattedDate =
                                    formatDate(post.dateISO) || formatDate(post.date) || post.date || "";

                                return (
                                    <Link key={post.slug} href={articleHref} className="block group">
                                        {/* Mobile: vertical card */}
                                        <article className="relative md:hidden flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:border-[#00BFFF]/60 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
                                            <div className="relative aspect-[16/9] overflow-hidden">
                                                <Image
                                                    src={post.image || placeholderImage}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    sizes="100vw"
                                                />
                                            </div>
                                            <div className="flex flex-col p-4">
                                                <h3 className="font-sans text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#00BFFF] dark:text-slate-50 dark:group-hover:text-[#33ceff] line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                {post.excerpt && (
                                                    <p className="mt-2 font-serif text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                                <div className="mt-3 flex items-center gap-1.5 text-[7.5px] font-sans">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        por: {displayName}
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                    <time className="text-slate-500 dark:text-slate-400 truncate">
                                                        {formattedDate}
                                                    </time>
                                                </div>
                                            </div>
                                        </article>

                                        {/* Desktop: horizontal card */}
                                        <article className="relative hidden md:flex flex-row h-[180px] overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:border-[#00BFFF]/60 dark:border-slate-800/70 dark:bg-slate-900/70 dark:hover:border-[#33ceff]/60">
                                            <div className="relative w-[240px] flex-shrink-0 bg-slate-200 dark:bg-slate-800 h-full">
                                                <Image
                                                    src={post.image || placeholderImage}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    sizes="240px"
                                                />
                                            </div>
                                            <div className="flex flex-1 flex-col justify-center gap-2 p-4 pr-8">
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff] line-clamp-2" style={{ color: (isCamila || isManuela || isIzco || isPablo || isEmiliano || isSofia || isMoises || isIgnacio || isRicardo) ? brandColor : undefined }}>
                                                    {post.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                                    {post.excerpt}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-[11px] font-sans">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                                                        por: {displayName}
                                                    </span>
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                    <time className="text-slate-500 dark:text-slate-400">
                                                        {formattedDate}
                                                    </time>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <style>{`
        @keyframes subcatGradMove {
          0%   { background-position: 0% 0; }
          50%  { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
      `}</style>
        </main>
    );
}

export const revalidate = false;
