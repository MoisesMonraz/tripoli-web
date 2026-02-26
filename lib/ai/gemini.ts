import type { TripoliSource } from "./tripoliKnowledge";
import { toolDeclarations, executeTool } from "./contentfulTools";
import { GoogleGenAI } from "@google/genai";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAnswer = {
  answer: string;
  sources: Array<{ title: string; url: string; excerpt?: string }>;
};

const NOT_FOUND_MESSAGE = "Aún no contamos con esa información publicada, pero puedo ayudarte con otros temas.";

/**
 * Builds the system instruction for Gemini (identity, rules, tool instructions, constraints).
 */
const buildSystemInstruction = (
  isFirstMessage: boolean,
  currentDate?: string,
  currentTime?: string,
): string => {
  const identityBlock = [
    "Eres Tripoli, el asistente oficial de inteligencia artificial de Tripoli Media.",
    "Tripoli Media es un ecosistema digital que ofrece contenido editorial especializado, analítica avanzada y soluciones web.",
    "Tu función: Ayudar a los usuarios a entender los servicios de Tripoli Media, encontrar información y conectarse con los recursos adecuados.",
    "Tono: Profesional, servicial, conciso y confiable.",
  ];

  const instructionsBlock = [
    "INSTRUCCIONES PRINCIPALES:",
    "1. APLICACIÓN DE PERSONALIDAD: Eres 'Tripoli'. Nunca uses frases genéricas como 'Soy un asistente de IA'.",
    isFirstMessage
      ? "2. PRIMERA INTERACCIÓN: Este es el primer mensaje del usuario. Responde calurosamente y preséntate brevemente. Ejemplo: '¡Hola! Soy Tripoli, tu asistente de Tripoli Media. ¿En qué puedo ayudarte hoy?'"
      : "2. CONVERSACIÓN CONTINUA: Esta es una conversación en curso. NUNCA vuelvas a decir 'Soy Tripoli' ni te presentes de nuevo. Solo responde directamente. El usuario ya te conoce.",
    "3. CONSULTAS ESPECÍFICAS: Para preguntas factuales sobre Tripoli Media (servicios, contacto, noticias, categorías), usa ÚNICAMENTE la información proporcionada en la sección FUENTES del mensaje del usuario.",
    "4. INFORMACIÓN DE CONTACTO: Si te piden datos de contacto, extrae explícitamente email, teléfono/WhatsApp y dirección física de la fuente 'Contacto'.",
    "5. CITACIONES: Solo cita fuentes que estén explícitamente listadas en la sección FUENTES. NUNCA inventes ni alucines nombres de páginas o URLs.",
    "",
    "HERRAMIENTAS DE CONTENIDO DINÁMICO:",
    "Tienes acceso a dos herramientas para consultar la base de datos de artículos de Tripoli Media:",
    "- searchArticleKnowledgeBase: Buscar artículos publicados por palabras clave, nombres de personas, empresas o temas.",
    "- checkCalendarArchive: Verificar qué artículos se publicaron en una fecha específica.",
    "IMPORTANTE: DEBES llamar a estas herramientas cuando el usuario pregunte sobre noticias específicas, artículos, personas, empresas, eventos o fechas de publicación.",
    "",
    "FORMATO DE ARTÍCULOS:",
    "Cuando listes artículos de los resultados de búsqueda, SIEMPRE usa este formato exacto:",
    "Artículo 1: [Título del Artículo](URL)",
    "Artículo 2: [Título del Artículo](URL)",
    "El título debe ser visible y clickeable, NO la URL cruda. Nunca muestres URLs crudas en la respuesta.",
    "",
    "PREGUNTAS TEMPORALES:",
    "Cuando el usuario pregunte sobre la fecha actual, hora, día, o cualquier información temporal:",
    "- Responde usando la Fecha Actual y Hora Actual proporcionadas en el contexto.",
    "- SOLO cita 'Calendario' como fuente. NO cites otras fuentes no relacionadas.",
    "",
    "RESTRICCIONES ESTRICTAS:",
    "- NUNCA inventes o fabriques información sobre Tripoli Media.",
    "- NUNCA respondas preguntas sobre temas fuera del alcance de Tripoli Media (ej: conocimiento general, otras empresas).",
    `- Si el usuario hace una pregunta específica y la respuesta NO está en las fuentes Y las herramientas no devuelven resultados, responde exactamente: "${NOT_FOUND_MESSAGE}"`,
    "- NUNCA rompas el personaje ni menciones que eres Claude, Anthropic o una IA genérica.",
    "- PRECISIÓN DE FUENTES: Solo cita fuentes que existan en la sección FUENTES. Si una fuente no está proporcionada, no la cites.",
    "- LISTAS DE CATEGORÍAS: Cuando menciones las categorías principales, SIEMPRE debes presentarlas como una lista numerada del 1 al 6, cada una en su propia línea, NUNCA como una lista separada por comas en un solo párrafo. Usa este formato exacto:\n'Las categorías de Tripoli Media son:\n1. Consumo y Retail\n2. Entretenimiento y Cultura\n3. Industria TI\n4. Infraestructura Social\n5. Política y Leyes\n6. Sector Salud'",
    "- LISTAS DE SUBCATEGORÍAS: Cuando menciones las subcategorías de una categoría, SIEMPRE debes presentarlas como una lista con guiones en líneas separadas, NUNCA como una lista separada por comas en un solo párrafo. Usa este formato exacto:\n'Las subcategorías de [Categoría] son:\n- Subcategoría 1\n- Subcategoría 2\n- Subcategoría 3'",
    "",
    "FORMATO DE SALIDA:",
    "Nunca uses formato markdown en tus respuestas. No uses asteriscos, negritas, cursivas, encabezados, viñetas con asteriscos ni ninguna otra sintaxis markdown. Escribe solo en texto plano usando lenguaje natural.",
    "Devuelve un objeto JSON con:",
    '- "answer": Tu texto de respuesta en texto plano sin markdown (string)',
    '- "sources": Array de objetos con campos "title", "url", y opcionalmente "excerpt". SOLO incluye fuentes que realmente usaste de la sección FUENTES.',
  ];

  const contextBlock = [
    currentDate ? `Fecha Actual: ${currentDate}` : "",
    currentTime ? `Hora Actual: ${currentTime}` : "",
  ].filter(Boolean);

  return [...identityBlock, "", ...instructionsBlock, "", ...contextBlock]
    .filter(Boolean)
    .join("\n");
};

/**
 * Builds the user message for Gemini (sources, history, and the user question).
 * Only dynamic, per-request content goes here.
 */
const buildUserMessage = (question: string, sources: TripoliSource[], history: ChatMessage[]): string => {
  const historyBlock = history.length
    ? history
      .map((item) => `${item.role === "user" ? "User" : "Tripoli"}: ${item.content}`)
      .join("\n")
    : "Sin conversación previa.";

  const sourcesBlock = sources
    .map(
      (source, idx) =>
        `[${idx + 1}] ${source.title}\nURL: ${source.url}\nContent: ${source.content}`
    )
    .join("\n\n");

  return [
    "HISTORIAL DE CONVERSACIÓN:",
    historyBlock,
    "",
    "FUENTES (Base de Conocimiento de Tripoli Media):",
    sourcesBlock || "No hay fuentes disponibles.",
    "",
    "PREGUNTA DEL USUARIO:",
    question,
  ]
    .filter(Boolean)
    .join("\n");
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
  currentDate,
  currentTime,
}: {
  question: string;
  sources: TripoliSource[];
  chatHistory?: ChatMessage[];
  lang?: string;
  currentDate?: string;
  currentTime?: string;
}): Promise<ChatAnswer> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in the server environment.");
  }

  const client = new GoogleGenAI({ apiKey });

  const isFirstMessage = chatHistory.length === 0;

  // Build system instruction
  const systemInstruction = buildSystemInstruction(isFirstMessage, currentDate, currentTime);

  // Build the user message with sources, history, and question
  const userMessage = buildUserMessage(question, sources, chatHistory);

  // Initialize chat with the new SDK
  // We use `gemini-2.5-flash` as requested
  const chat = client.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: toolDeclarations }],
    }
  });

  // Retry logic with exponential backoff
  let response;
  let attempt = 0;
  const maxRetries = 3;
  while (attempt <= maxRetries) {
    try {
      // Use sendMessage allowing tool usage
      response = await chat.sendMessage({
        message: userMessage,
      });
      break; // Success
    } catch (error: any) {
      if (attempt === maxRetries) throw error;

      const isRetryable = error.status === 503 || error.status === 500 || error.message?.includes("Overloaded") || error.message?.includes("quota");
      if (!isRetryable && error.code !== 429) throw error;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  if (!response) throw new Error("Failed to get response from Gemini.");

  // Tool execution loop
  let rounds = 0;

  while (rounds < 3) {
    // Check for tool calls in the response candidates
    // Note: new SDK response objects might vary, but typically have `functionCalls` getter
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) break;

    const functionResponses: any[] = [];
    for (const fc of functionCalls) {
      const toolResult = await executeTool(fc.name, fc.args as Record<string, any>);
      functionResponses.push({
        id: fc.id, // Important: pass the call ID back in new SDK
        name: fc.name,
        response: { result: toolResult },
      });
    }

    // Send tool results back
    response = await chat.sendMessage({
      message: functionResponses.map(fr => ({
        functionResponse: {
          name: fr.name,
          id: fr.id,
          response: fr.response
        }
      }))
    });
    rounds++;
  }

  // Extract final text
  const text = response.text || "";

  const parsed = extractJson(text);
  const fallbackSources = sources.map((source) => ({
    title: source.title,
    url: source.url,
    excerpt: buildExcerpt(source.content),
  }));
  const notFoundMessage = NOT_FOUND_MESSAGE;

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
      if (match) {
        return {
          title: source.title || match.title,
          url: match.url,
          excerpt: source.excerpt || buildExcerpt(match.content),
        };
      }
      if (source.url && source.title) {
        return {
          title: source.title,
          url: source.url,
          excerpt: source.excerpt || "",
        };
      }
      return null;
    })
    .filter((source): source is { title: string; url: string; excerpt: string } => Boolean(source));

  return {
    answer: parsed.answer,
    sources: normalizedSources.length ? normalizedSources : fallbackSources,
  };
};
