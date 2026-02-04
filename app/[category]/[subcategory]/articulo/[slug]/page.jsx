import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getArticleBySlug, getArticles } from "../../../../../lib/contentful";
import ArticleContent from "../../../../../components/article/ArticleContent";
import SocialShareBar from "../../../../../components/article/SocialShareBar";

const formatFullSpanishDate = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  if (parts.weekday && parts.day && parts.month && parts.year) {
    return `${parts.weekday} ${parts.day} de ${parts.month} del ${parts.year}`;
  }
  return formatter.format(date);
};

/**
 * Format category labels with proper casing for "TI"
 */
const formatCategoryLabel = (label) => {
  if (!label) return '';
  // Replace " Ti" or " ti" with " TI" (case insensitive)
  return label.replace(/\bti\b/gi, 'TI');
};
export async function generateStaticParams() {
  const articles = await getArticles();
  return articles
    .filter((a) => a.category && a.subcategory && a.slug)
    .map((article) => ({
      category: article.category,
      subcategory: article.subcategory,
      slug: article.slug,
    }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | Tripoli Media" };
  }

  return {
    title: `${article.metaTitle || article.title} | Tripoli Media`,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
      type: "article",
      images: [article.image],
    },
  };
}

/**
 * Reusable Figure component for article images
 */
const ArticleImage = ({ src, alt, caption, priority = false }) => {
  if (!src) return null;

  return (
    <figure className="mx-auto mt-5 max-w-3xl px-5 sm:px-6 md:mt-8 lg:px-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          quality={85}
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-slate-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * Reusable wrapper for Rich Text content blocks
 */
const ContentBlock = ({ content, className = "" }) => {
  if (!content) return null;

  return (
    <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
      <ArticleContent
        content={content}
        className={`article-body ${className}`}
      />
    </div>
  );
};

export default async function ArticlePage({ params }) {
  const { category, subcategory, slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const categoryLabel = (article.category || category || "").replace(/-/g, " ");
  const subcategoryLabel = (article.subcategory || subcategory || "").replace(
    /-/g,
    " "
  );

  const categorySlug = article.category || category;
  const subcategorySlug = article.subcategory || subcategory;
  const formattedDate =
    formatFullSpanishDate(article.dateISO) || article.date || "";

  // Check if article uses new modular structure or legacy single-body structure
  const hasModularContent = article.introduccion || article.body1 || article.body2;

  return (
    <main className="bg-neutral-50 pb-12 md:pb-24 dark:bg-slate-950">
      <article>
        {/* Header section */}
        <header className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          {/* Category + Subcategory label */}
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] md:mb-4 md:text-xs">
            {categoryLabel && (
              <Link
                href={`/categoria/${categorySlug}`}
                className="text-[#00BFFF] transition-colors hover:text-[#0099CC]"
              >
                {categoryLabel}
              </Link>
            )}
            {categoryLabel && subcategoryLabel && (
              <span className="text-slate-300 dark:text-slate-600">/</span>
            )}
            {subcategoryLabel && (
              <Link
                href={`/categoria/${categorySlug}/${subcategorySlug}`}
                className="text-[#00BFFF] transition-colors hover:text-[#0099CC]"
              >
                {subcategoryLabel}
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="font-sans text-[1.3125rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-[1.64rem] md:text-[2.625rem] dark:text-slate-50">
            {article.title}
          </h1>

          {/* Excerpt / Lead */}
          {article.excerpt && (
            <p className="mt-3 font-serif text-lg leading-relaxed text-slate-600 md:mt-5 md:text-xl dark:text-slate-300">
              {article.excerpt}
            </p>
          )}

          {/* Author + Date + Share Bar */}
          <div className="mt-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-6 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-sans text-slate-500 md:gap-3 md:text-sm dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Tripoli Publishing House
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <time dateTime={article.dateISO || article.date}>
                {formattedDate}
              </time>
            </div>
            <SocialShareBar title={article.title} />
          </div>
        </header>

        {/* Article Body - Modular Structure */}
        {hasModularContent ? (
          <>
            {/* 1. Introduccion */}
            <ContentBlock content={article.introduccion} />

            {/* 2. Image 1 (Hero) */}
            <ArticleImage
              src={article.image1 || article.image}
              alt={article.image1Caption || article.imageCaption || article.title}
              caption={article.image1Caption || article.imageCaption}
              priority
            />

            {/* 3. Body 1 */}
            <ContentBlock
              content={article.body1}
              className="article-body--no-dropcap"
            />

            {/* 4. Image 2 */}
            <ArticleImage
              src={article.image2}
              alt={article.image2Caption || `${article.title} - imagen 2`}
              caption={article.image2Caption}
            />

            {/* 5. Body 2 */}
            <ContentBlock
              content={article.body2}
              className="article-body--no-dropcap"
            />

            {/* 6. Image 3 */}
            <ArticleImage
              src={article.image3}
              alt={article.image3Caption || `${article.title} - imagen 3`}
              caption={article.image3Caption}
            />

            {/* 7. Cierre */}
            <ContentBlock
              content={article.cierre}
              className="article-body--no-dropcap"
            />

            {/* 8. Fuentes */}
            {article.fuentes && (
              <div className="mx-auto mt-8 max-w-3xl px-5 sm:px-6 md:mt-12 lg:px-0">
                <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <ArticleContent
                    content={article.fuentes}
                    className="article-body article-body--sources text-sm"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Legacy fallback: single body field */
          <>
            <ArticleImage
              src={article.image}
              alt={article.imageCaption || article.title}
              caption={article.imageCaption}
              priority
            />
            <ContentBlock content={article.content} />
          </>
        )}

        {/* Breadcrumb footer */}
        <footer className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          <nav className="text-[8px] sm:text-[10px] font-sans whitespace-nowrap text-slate-400 dark:text-slate-500">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-[#00BFFF]"
                >
                  Inicio
                </Link>
              </li>
              <li className="text-slate-300 dark:text-slate-600">/</li>
              {categoryLabel && (
                <>
                  <li>
                    <Link
                      href={`/categoria/${categorySlug}`}
                      className="capitalize transition-colors hover:text-[#00BFFF]"
                    >
                      {formatCategoryLabel(categoryLabel)}
                    </Link>
                  </li>
                  <li className="text-slate-300 dark:text-slate-600">/</li>
                </>
              )}
              {subcategoryLabel && (
                <>
                  <li>
                    <Link
                      href={`/categoria/${categorySlug}/${subcategorySlug}`}
                      className="capitalize transition-colors hover:text-[#00BFFF]"
                    >
                      {formatCategoryLabel(subcategoryLabel)}
                    </Link>
                  </li>
                  <li className="text-slate-300 dark:text-slate-600">/</li>
                </>
              )}
              <li className="truncate text-slate-600 dark:text-slate-400">
                {article.title}
              </li>
            </ol>
          </nav>
        </footer>
      </article>
    </main>
  );
}

// ISR: Revalidate every 1 hour
export const revalidate = 3600;
