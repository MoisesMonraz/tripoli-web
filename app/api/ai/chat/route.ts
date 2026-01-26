import { NextRequest, NextResponse } from "next/server";
import { generateTripoliAnswer } from "@/lib/ai/gemini";
import { retrieveTripoliSources } from "@/lib/ai/tripoliRetrieval";
import { getTripoliKnowledge, type TripoliSource } from "@/lib/ai/tripoliKnowledge";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  message: string;
  history?: IncomingMessage[];
  lang?: "EN" | "ES";
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const NO_SOURCES_MESSAGE = {
  EN: "We don't have that information published yet, but I can help with other topics.",
  ES: "A\u00fan no contamos con esa informaci\u00f3n publicada, pero puedo ayudarte con otros temas.",
} as const;
const GENERIC_ERROR_MESSAGE = {
  EN: "We don't have that information published yet, but I can help with other topics.",
  ES: "A\u00fan no contamos con esa informaci\u00f3n publicada, pero puedo ayudarte con otros temas.",
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

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
};

export async function POST(request: NextRequest) {
  let lang: "EN" | "ES" = "ES";
  try {
    let body: ChatRequest | null = null;

    try {
      body = (await request.json()) as ChatRequest;
      lang = body?.lang === "EN" ? "EN" : "ES";
    } catch {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] });
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ answer: RATE_LIMIT_MESSAGE[lang], sources: [] });
    }

    const message = body?.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ answer: INVALID_REQUEST_MESSAGE[lang], sources: [] });
    }

    if (message.length > 800) {
      return NextResponse.json({ answer: TOO_LONG_MESSAGE[lang], sources: [] });
    }

    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];

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

    if (siteSummary) {
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
    });

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    return NextResponse.json({ answer: GENERIC_ERROR_MESSAGE[lang], sources: [] });
  }
}

// Developer note: run `npm run dev`, open the site, click the robot button, and ask
// “What is the contact email?” Expect the answer with a `/contacto` citation.
