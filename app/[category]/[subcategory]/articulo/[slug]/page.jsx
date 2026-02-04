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

const splitContentAtFirstParagraph = (content) => {
  if (!content || !Array.isArray(content.content)) {
    return { intro: content, rest: null, hasIntroParagraph: false };
  }

  const firstParagraphIndex = content.content.findIndex(
    (node) => node?.nodeType === "paragraph"
  );

  if (firstParagraphIndex === -1) {
    return { intro: content, rest: null, hasIntroParagraph: false };
  }

  const introNodes = content.content.slice(0, firstParagraphIndex + 1);
  const restNodes = content.content.slice(firstParagraphIndex + 1);

  return {
    intro: { ...content, content: introNodes },
    rest: restNodes.length ? { ...content, content: restNodes } : null,
    hasIntroParagraph: true,
  };
};

const splitBeforeLastParagraphs = (richText) => {
  if (!richText || !Array.isArray(richText.content) || richText.content.length === 0) {
    return { mainBody: richText, lastParagraphs: null };
  }

  const nodes = richText.content;
  const paragraphIndices = [];

  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeType === "paragraph") {
      paragraphIndices.push(i);
    }
  }

  if (paragraphIndices.length < 3) {
    return { mainBody: richText, lastParagraphs: null };
  }

  const splitIndex = paragraphIndices[paragraphIndices.length - 3];

  return {
    mainBody: { ...richText, content: nodes.slice(0, splitIndex) },
    lastParagraphs: { ...richText, content: nodes.slice(splitIndex) },
  };
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
  const { intro, rest, hasIntroParagraph } = splitContentAtFirstParagraph(
    article.content
  );

  const heroImage = article.image ? (
    <figure className="mx-auto mt-5 max-w-3xl px-5 sm:px-6 md:mt-8 lg:px-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
        <Image
          src={article.image}
          alt={article.imageCaption || article.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          quality={85}
        />
      </div>
      {article.imageCaption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-slate-500 dark:text-slate-400">
          {article.imageCaption}
        </figcaption>
      )}
    </figure>
  ) : null;

  const secondaryImageElement = article.secondaryImage ? (
    <figure className="mx-auto mt-5 max-w-3xl px-5 sm:px-6 md:mt-8 lg:px-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
        <Image
          src={article.secondaryImage}
          alt={article.secondaryImageCaption || `${article.title} - imagen secundaria`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          quality={85}
        />
      </div>
      {article.secondaryImageCaption && (
        <figcaption className="mt-3 text-center font-sans text-sm text-slate-500 dark:text-slate-400">
          {article.secondaryImageCaption}
        </figcaption>
      )}
    </figure>
  ) : null;

  const { mainBody, lastParagraphs } = splitBeforeLastParagraphs(rest);

  return (
    <main className="bg-neutral-50 pb-24 dark:bg-slate-950">
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

        {hasIntroParagraph ? (
          <>
            {intro && (
              <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
                <ArticleContent content={intro} />
              </div>
            )}
            {heroImage}
            {mainBody && (
              <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
                <ArticleContent
                  content={mainBody}
                  className="article-body article-body--no-dropcap"
                />
              </div>
            )}
            {secondaryImageElement}
            {lastParagraphs && (
              <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
                <ArticleContent
                  content={lastParagraphs}
                  className="article-body article-body--no-dropcap"
                />
              </div>
            )}
          </>
        ) : (
          <>
            {heroImage}
            {intro && (
              <div className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
                <ArticleContent content={intro} />
              </div>
            )}
          </>
        )}

        {/* Breadcrumb footer */}
        <footer className="mx-auto mt-6 max-w-3xl px-5 sm:px-6 md:mt-10 lg:px-0">
          <nav className="text-[10px] font-sans whitespace-nowrap text-slate-400 dark:text-slate-500">
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
                      {categoryLabel}
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
                      {subcategoryLabel}
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
