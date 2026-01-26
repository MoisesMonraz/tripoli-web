import type { TripoliSource } from "./tripoliKnowledge";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAnswer = {
  answer: string;
  sources: Array<{ title: string; url: string; excerpt?: string }>;
};

const NOT_FOUND_MESSAGES = {
  EN: "We don't have that information published yet, but I can help with other topics.",
  ES: "A\u00fan no contamos con esa informaci\u00f3n publicada, pero puedo ayudarte con otros temas.",
} as const;

let cachedGeminiModule: typeof import("@google/generative-ai") | null = null;
const loadGeminiModule = async () => {
  if (!cachedGeminiModule) {
    cachedGeminiModule = await import("@google/generative-ai");
  }
  return cachedGeminiModule;
};

const buildPrompt = (question: string, sources: TripoliSource[], history: ChatMessage[], lang: "EN" | "ES") => {
  const languageName = lang === "EN" ? "English" : "Spanish";
  const notFoundMessage = NOT_FOUND_MESSAGES[lang];
  const siteContext =
    lang === "EN"
      ? "Context: Tripoli Media is the website you are answering about."
      : "Contexto: Tripoli Media es el sitio web del que respondes.";
  const sourceInstruction =
    lang === "EN"
      ? "Answer only with information that exists on Tripoli Media and include the source page link whenever possible."
      : "Responde \u00fanicamente con informaci\u00f3n que exista en Tripoli Media e incluye el enlace de la p\u00e1gina de origen cuando sea posible.";
  const historyBlock = history.length
    ? history
        .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
        .join("\n")
    : "No prior messages.";

  const sourcesBlock = sources
    .map(
      (source, idx) =>
        `[${idx + 1}] ${source.title}\nURL: ${source.url}\nContent: ${source.content}`
    )
    .join("\n\n");

  return [
    "You are Tripoli Media's site assistant.",
    siteContext,
    `Answer in ${languageName}.`,
    "Use ONLY the provided sources to answer.",
    sourceInstruction,
    `If the sources do not contain the answer, reply exactly: "${notFoundMessage}" and return an empty sources array.`,
    "Return ONLY valid JSON with keys: answer (string) and sources (array of { title, url, excerpt? }).",
    "Every answer must include sources when possible, using the provided URLs.",
    "Cite only URLs from the provided sources.",
    "",
    "Conversation history:",
    historyBlock,
    "",
    "Sources:",
    sourcesBlock || "No sources provided.",
    "",
    `User question: ${question}`,
  ].join("\n");
};

const extractJson = (text: string): ChatAnswer | null => {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const json = trimmed.slice(start, end + 1);
    return JSON.parse(json) as ChatAnswer;
  } catch {
    return null;
  }
};

const buildExcerpt = (content: string) => {
  if (content.length <= 180) return content;
  return `${content.slice(0, 177)}...`;
};

export const generateTripoliAnswer = async ({
  question,
  sources,
  chatHistory = [],
  lang = "ES",
}: {
  question: string;
  sources: TripoliSource[];
  chatHistory?: ChatMessage[];
  lang?: "EN" | "ES";
}): Promise<ChatAnswer> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in the server environment.");
  }

  const { GoogleGenerativeAI } = await loadGeminiModule();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const prompt = buildPrompt(question, sources, chatHistory, lang);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = extractJson(text);
  const fallbackSources = sources.map((source) => ({
    title: source.title,
    url: source.url,
    excerpt: buildExcerpt(source.content),
  }));
  const notFoundMessage = NOT_FOUND_MESSAGES[lang];

  if (!parsed || !parsed.answer) {
    return {
      answer: notFoundMessage,
      sources: [],
    };
  }

  if (parsed.answer.trim() === notFoundMessage) {
    return {
      answer: notFoundMessage,
      sources: [],
    };
  }

  if (!parsed.sources || parsed.sources.length === 0) {
    return {
      answer: parsed.answer,
      sources: fallbackSources,
    };
  }

  const allowedByUrl = new Map(sources.map((source) => [source.url, source]));
  const normalizedSources = parsed.sources
    .map((source) => {
      const match = allowedByUrl.get(source.url);
      if (!match) return null;
      return {
        title: source.title || match.title,
        url: match.url,
        excerpt: source.excerpt || buildExcerpt(match.content),
      };
    })
    .filter((source): source is { title: string; url: string; excerpt?: string } => Boolean(source));

  return {
    answer: parsed.answer,
    sources: normalizedSources.length ? normalizedSources : fallbackSources,
  };
};
