import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "../../../../../lib/contentful";
import ArticlePageClient from "../../../../../components/article/ArticlePageClient";
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
  const { slug, category } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | Tripoli Media" };
  }

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt || article.title;
  const url = `https://www.tripoli.media/${article.category || category}/${slug}`;

  return {
    title: `${title} | Tripoli Media`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "Tripoli Media",
      locale: "es_MX",
      publishedTime: article.dateISO,
      authors: [article.author],
      section: article.categoryName,
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const categorySlug = article.category || category;
  const subcategorySlug = article.subcategory || subcategory;

  return (
    <main className="bg-neutral-50 pb-12 md:pb-24 dark:bg-slate-950">
      <ArticlePageClient
        initialArticle={article}
        slug={slug}
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
      />
    </main>
  );
}

// ISR: Revalidate every 1 hour
export const revalidate = 3600;
