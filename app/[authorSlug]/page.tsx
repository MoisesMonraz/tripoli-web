import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuthorBySlug, specialAuthors } from "@/lib/authors";
import { getArticlesByAuthor } from "@/lib/contentful";

// ─── Static paths ─────────────────────────────────────────────────────────────
export function generateStaticParams() {
    return specialAuthors.map((author) => ({ authorSlug: author.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ authorSlug: string }>;
}) {
    const { authorSlug } = await params;
    const author = getAuthorBySlug(authorSlug);
    if (!author) return {};
    return {
        title: `${author.name} | Tripoli Media`,
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
    const author = getAuthorBySlug(authorSlug);
    // Only render for known special authors; all other slugs fall through to 404
    if (!author) notFound();

    const articles = await getArticlesByAuthor(author.name);

    // Initials fallback for when no photo is available
    const initials = author.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <main className="flex flex-col pb-20">

            {/* ── SECTION A: Author profile ───────────────────────────────────────── */}
            <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                {/* Left: Photo */}
                <div className="relative min-h-[300px] md:min-h-[400px] bg-slate-100 dark:bg-slate-800">
                    <Image
                        src={author.photoUrl}
                        alt={`Foto de ${author.name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Initials fallback — shown as overlay when image fails */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-400 dark:text-slate-500 select-none"
                        style={{ zIndex: -1 }}
                    >
                        {initials}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="flex flex-col justify-center px-10 py-12 bg-white dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        Tripoli Media
                    </p>
                    <h1
                        className="mt-3 font-bold text-slate-900 dark:text-slate-50 leading-tight"
                        style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
                    >
                        {author.name}
                    </h1>
                    <p className="mt-2 text-[13px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                        {author.role}
                    </p>
                    <hr className="my-6 border-t border-slate-200 dark:border-slate-700" />
                    <p className="text-base leading-[1.7] text-slate-700 dark:text-slate-300">
                        {author.bio}
                    </p>

                    {/* Social links (only shown if defined) */}
                    {author.social && (
                        <div className="mt-6 flex gap-4">
                            {author.social.twitter && (
                                <a
                                    href={`https://twitter.com/${author.social.twitter}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#009fe3] hover:underline"
                                >
                                    Twitter
                                </a>
                            )}
                            {author.social.linkedin && (
                                <a
                                    href={`https://linkedin.com/in/${author.social.linkedin}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#009fe3] hover:underline"
                                >
                                    LinkedIn
                                </a>
                            )}
                            {author.social.instagram && (
                                <a
                                    href={`https://instagram.com/${author.social.instagram}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#009fe3] hover:underline"
                                >
                                    Instagram
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ── SECTION B: Articles list ────────────────────────────────────────── */}
            <div className="max-w-[70rem] mx-auto w-full px-4 sm:px-[12px] md:px-4 pt-16">
                <section className="flex flex-col gap-6">
                    {/* Section heading — same style as subcategory pages */}
                    <div className="flex items-center gap-3">
                        <span
                            className="h-[44px] w-[8px] rounded-sm flex-shrink-0"
                            style={{ background: "#009fe3" }}
                            aria-hidden="true"
                        />
                        <h2
                            className="text-lg lg:text-xl font-semibold uppercase font-raleway tracking-[0.05em]"
                            style={{ color: "#009fe3" }}
                        >
                            Artículos de {author.name}
                        </h2>
                        <div
                            className="h-[44px] flex-1 rounded-sm"
                            style={{
                                background:
                                    "linear-gradient(90deg, #009fe3, #83d0f5, #009fe3)",
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
                                                        por: {author.name}
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
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00BFFF] dark:group-hover:text-[#33ceff] line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                                    {post.excerpt}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-[11px] font-sans">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                                                        por: {author.name}
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
