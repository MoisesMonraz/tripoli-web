/**
 * ==========================================
 * TRIPOLI MEDIA - CONTENTFUL ARTICLE TOOLS
 * ==========================================
 *
 * Two LLM-callable tools for dynamic article retrieval:
 * - searchArticleKnowledgeBase: keyword/entity search across articles
 * - checkCalendarArchive: date-based publication lookup
 *
 * Used by Gemini function calling in gemini.ts
 */

import { searchArticles, getLatestArticles } from "../contentful";

// ==========================================
// TYPES
// ==========================================

type ArticleToolResult = {
  title: string;
  excerpt: string;
  date: string;
  dateISO: string;
  category: string;
  subcategory: string;
  slug: string;
  url: string;
  author: string;
};

type SearchResult = {
  found: boolean;
  count: number;
  articles: ArticleToolResult[];
};

type CalendarResult = {
  found: boolean;
  date: string;
  count: number;
  articles: ArticleToolResult[];
};

// ==========================================
// HELPERS
// ==========================================

/**
 * Recursively extract plain text from Contentful RichText JSON
 */
function extractRichTextPlain(node: any): string {
  if (!node) return "";
  if (node.nodeType === "text") return node.value || "";
  if (Array.isArray(node.content)) {
    return node.content.map(extractRichTextPlain).join("");
  }
  return "";
}

function truncateExcerpt(text: string, maxLength = 250): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 3) + "...";
}

/**
 * Convert a transformed article into the tool result format
 */
function formatArticleResult(article: any): ArticleToolResult {
  const bodyText = extractRichTextPlain(article.content);
  return {
    title: article.title,
    excerpt: truncateExcerpt(bodyText),
    date: article.date,
    dateISO: article.dateISO,
    category: article.categoryName || article.category,
    subcategory: article.subcategoryName || article.subcategory,
    slug: article.slug,
    url: `/${article.category}/${article.subcategory}/articulo/${article.slug}`,
    author: article.author || "Tripoli Media",
  };
}

/**
 * Convert an ISO date string to YYYY-MM-DD using local timezone
 */
function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normalize various date input formats to YYYY-MM-DD
 */
function normalizeInputDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return dateStr;
}

// ==========================================
// TOOL IMPLEMENTATIONS
// ==========================================

/**
 * Tool A: Search articles by keywords, entity names, or topics.
 * Uses Contentful's native full-text search across title, body, etc.
 */
export async function searchArticleKnowledgeBase(
  keywords: string
): Promise<SearchResult> {
  try {
    const articles = await searchArticles(keywords, 10);
    const results = articles.map(formatArticleResult);
    return {
      found: results.length > 0,
      count: results.length,
      articles: results,
    };
  } catch (error) {
    console.error("searchArticleKnowledgeBase error:", error);
    return { found: false, count: 0, articles: [] };
  }
}

/**
 * Tool B: Check which articles were published on a specific date.
 * Normalizes dates to YYYY-MM-DD (local timezone) for comparison.
 */
export async function checkCalendarArchive(
  date: string
): Promise<CalendarResult> {
  try {
    const targetDate = normalizeInputDate(date);
    const allArticles = await getLatestArticles(100);
    const matching = allArticles.filter((article: any) => {
      if (!article.dateISO) return false;
      return toLocalDateKey(article.dateISO) === targetDate;
    });
    const results = matching.map(formatArticleResult);
    return {
      found: results.length > 0,
      date: targetDate,
      count: results.length,
      articles: results,
    };
  } catch (error) {
    console.error("checkCalendarArchive error:", error);
    return { found: false, date, count: 0, articles: [] };
  }
}

/**
 * Dispatch tool execution by name
 */
export async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  switch (name) {
    case "searchArticleKnowledgeBase":
      return searchArticleKnowledgeBase(args.keywords as string);
    case "checkCalendarArchive":
      return checkCalendarArchive(args.date as string);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ==========================================
// GEMINI FUNCTION DECLARATIONS
// ==========================================

/**
 * Tool schemas for Gemini function calling.
 * Type values use string literals matching SchemaType enum values
 * ("STRING", "OBJECT") since the module is loaded dynamically.
 */
export const toolDeclarations: any[] = [
  {
    name: "searchArticleKnowledgeBase",
    description:
      "Search Tripoli Media's published articles database by keywords or topics. " +
      "Use this to find specific news articles, mentions of companies, people (e.g. 'Elon Musk', 'Apple'), " +
      "or articles about specific topics, industries, or events. " +
      "Searches through article titles, categories, subcategories, body content, and author fields.",
    parameters: {
      type: "OBJECT",
      properties: {
        keywords: {
          type: "STRING",
          description:
            "Search keywords or topic to find relevant articles. Can be a person name, company name, " +
            "industry topic, or any relevant search term. Examples: 'Elon Musk', 'fabricantes tecnología', " +
            "'Apple Samsung', 'infraestructura social'.",
        },
      },
      required: ["keywords"],
    },
  },
  {
    name: "checkCalendarArchive",
    description:
      "Check which articles were published on a specific date in the Tripoli Media editorial calendar. " +
      "Use this when users ask about publications on a particular day, such as 'What was published on January 28?' " +
      "or '¿Qué se publicó el 28 de enero?'. The date must be in YYYY-MM-DD format.",
    parameters: {
      type: "OBJECT",
      properties: {
        date: {
          type: "STRING",
          description:
            "The target publication date in YYYY-MM-DD format. Convert relative dates (like 'yesterday', 'ayer') " +
            "to absolute dates using the current date provided in context. Example: '2026-01-28'.",
        },
      },
      required: ["date"],
    },
  },
];
