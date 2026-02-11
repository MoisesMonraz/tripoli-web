import { NextRequest, NextResponse } from "next/server";
import { generateTripoliAnswer } from "@/lib/ai/gemini";
import { retrieveTripoliSources } from "@/lib/ai/tripoliRetrieval";
import { getTripoliKnowledge, type TripoliSource } from "@/lib/ai/tripoliKnowledge";
import { searchArticles } from "@/lib/contentful";
import { isRateLimited } from "@/lib/security/rateLimit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  message: string;
  history?: IncomingMessage[];
  lang?: "EN" | "ES";
  currentDate?: string;
  currentTime?: string;
  captchaToken?: string | null;
};

const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 800;
const NO_SOURCES_MESSAGE = {
  EN: "We don't have that information published yet, but I can help with other topics.",
  ES: "A\u00fan no contamos con esa informaci\u00f3n publicada, pero puedo ayudarte con otros temas.",
} as const;
const GENERIC_ERROR_MESSAGE = {
  EN: "Something went wrong. Please try again in a moment.",
  ES: "Ocurri\u00f3 un error. Por favor, int\u00e9ntalo de nuevo en un momento.",
} as const;
const INVALID_REQUEST_MESSAGE = {
  EN: "Please send a valid question so I can help you.",
  ES: "Por favor, env\u00eda una pregunta v\u00e1lida para poder ayudarte.",
} as const;
const TOO_LONG_MESSAGE = {
  EN: "Your message is too long. Please shorten it.",
  ES: "Tu mensaje es demasiado largo. Por favor, ac\u00f3rtalo.",
} as const;
const RATE_LIMIT_MESSAGE = {
  EN: "You're asking too quickly. Please wait a moment and try again.",
  ES: "Est\u00e1s preguntando muy r\u00e1pido. Por favor, espera un momento y vuelve a intentar.",
} as const;
const CAPTCHA_ERROR_MESSAGE = {
  EN: "We could not verify your request. Please try again.",
  ES: "No pudimos verificar tu solicitud. Int\u00e9ntalo de nuevo.",
} as const;

const getRequestOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

const getAllowedOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const validateOrigin = (request: NextRequest): string | null => {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return null;
  const origin = getRequestOrigin(request);
  if (!origin) return "Missing Origin or Referer.";
  if (!allowed.includes(origin)) return "Origin not allowed.";
  return null;
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};


const sanitizeHistory = (history?: IncomingMessage[]) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
};

export async function POST(request: NextRequest) {
  let lang: "EN" | "ES" = "ES";
  try {
    let body: ChatRequest | null = null;

    const originError = validateOrigin(request);
    if (originError) {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] }, { status: 415 });
    }

    try {
      body = (await request.json()) as ChatRequest;
      lang = body?.lang === "EN" ? "EN" : "ES";
    } catch {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rateLimit = await isRateLimited({
      key: ip,
      max: 12,
      windowMs: 60_000,
      namespace: "chat",
    });
    if (rateLimit.limited) {
      return NextResponse.json({ answer: RATE_LIMIT_MESSAGE[lang], sources: [] }, { status: 429 });
    }

    const captchaToken = body?.captchaToken ?? request.headers.get("x-captcha-token");
    const captchaResult = await verifyTurnstileToken(captchaToken ?? null, ip);
    if (!captchaResult.ok) {
      return NextResponse.json({ answer: CAPTCHA_ERROR_MESSAGE[lang], sources: [] }, { status: 403 });
    }

    const message = body?.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] }, { status: 400 });
    }

    if (message.length > 800) {
      return NextResponse.json({ answer: TOO_LONG_MESSAGE[lang], sources: [] }, { status: 413 });
    }

    const history = sanitizeHistory(body?.history);

    let sources: TripoliSource[] = [];
    const knowledge = getTripoliKnowledge();
    const siteSummary = knowledge.find((source) => source.id === "tripoli-media");
    try {
      sources = retrieveTripoliSources(message, 6) ?? [];
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
      sources = [];
    }

    // Fetch dynamic articles from Contentful matching the user's query
    try {
      const articles = await searchArticles(message, 5);
      const articleSources: TripoliSource[] = (articles as any[]).map((article) => ({
        id: `article-${article.slug}`,
        title: article.title,
        url: `/${article.category}/${article.subcategory}/articulo/${article.slug}`,
        section: article.categoryName || "Artículos",
        content: `TÍTULO: ${article.title}.
CONTENIDO: ${article.plainTextContent || article.excerpt || ""}
CONTEXTO: Categoría: ${article.categoryName || ""}. Subcategoría: ${article.subcategoryName || ""}. Fecha: ${article.date}. Autor: ${article.author || "Tripoli Media"}.`,
        tags: [article.category, article.subcategory, article.categoryName, article.subcategoryName].filter(Boolean),
      }));
      const existingUrls = new Set(sources.map((s) => s.url));
      const uniqueArticles = articleSources.filter((a) => !existingUrls.has(a.url));
      sources = [...sources, ...uniqueArticles];
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Article search error:", error);
      }
    }

    // Guarantee Gemini always has core context: site summary + key pages.
    // For greetings or vague queries where retrieval returns nothing,
    // the bot still needs enough context to respond as "Tripoli".
    if (sources.length === 0) {
      const coreIds = ["tripoli-media", "contacto", "servicios", "conocenos"];
      sources = knowledge.filter((s) => coreIds.includes(s.id));
    } else if (siteSummary) {
      sources = [siteSummary, ...sources.filter((source) => source.id !== siteSummary.id)];
    }

    if (!Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json({ answer: NO_SOURCES_MESSAGE[lang], sources: [] });
    }

    const result = await generateTripoliAnswer({
      question: message,
      sources,
      chatHistory: history,
      lang,
      currentDate: body?.currentDate,
      currentTime: body?.currentTime,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CHAT_ERROR:", error?.message || error);
    return NextResponse.json({
      answer: GENERIC_ERROR_MESSAGE[lang],
      sources: []
    }, { status: 500 });
  }
}

// Developer note: run `npm run dev`, open the site, click the robot button, and ask
// "What is the contact email?" Expect the answer with a `/contacto` citation.
