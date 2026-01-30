import type { TripoliSource } from "./tripoliKnowledge";
import { toolDeclarations, executeTool } from "./contentfulTools";

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

/**
 * Detects the language of a user query
 * Returns "EN" or "ES" based on linguistic patterns
 */
const detectQueryLanguage = (query: string): "EN" | "ES" => {
  const normalizedQuery = query.toLowerCase().trim();

  // Spanish indicators (high confidence)
  const spanishPatterns = [
    /\b(qué|cómo|cuál|cuáles|dónde|cuándo|cuánto|por qué|quién|quiénes)\b/,
    /\b(es|son|está|están|hay|tiene|tienen|puedo|puedes|puede)\b/,
    /\b(el|la|los|las|un|una|unos|unas|del|al)\b/,
    /\b(información|teléfono|dirección|contacto|servicios|noticias|categorías)\b/,
    /\b(hola|buenos|buenas|días|tardes|gracias|favor)\b/,
  ];

  // English indicators (high confidence)
  const englishPatterns = [
    /\b(what|how|which|where|when|why|who|whose)\b/,
    /\b(is|are|have|has|can|could|would|should|do|does)\b/,
    /\b(the|a|an|of|to|for|with|from|by)\b/,
    /\b(information|phone|address|contact|services|news|categories)\b/,
    /\b(hello|hi|hey|good|morning|afternoon|thanks|please)\b/,
  ];

  let spanishScore = 0;
  let englishScore = 0;

  spanishPatterns.forEach((pattern) => {
    if (pattern.test(normalizedQuery)) spanishScore++;
  });

  englishPatterns.forEach((pattern) => {
    if (pattern.test(normalizedQuery)) englishScore++;
  });

  // If tied or unclear, default to Spanish (primary audience)
  return englishScore > spanishScore ? "EN" : "ES";
};

/**
 * Resolves the response language: respects explicit EN, otherwise auto-detects
 */
const resolveLanguage = (question: string, lang: "EN" | "ES"): "EN" | "ES" => {
  const detectedLang = detectQueryLanguage(question);
  return lang === "EN" ? "EN" : detectedLang;
};

/**
 * Builds the system instruction for Gemini (identity, rules, tool instructions, constraints).
 * This is passed via the systemInstruction config so Gemini treats it as authoritative,
 * which makes tool calling significantly more reliable.
 */
const buildSystemInstruction = (
  lang: "EN" | "ES",
  isFirstMessage: boolean,
  currentDate?: string,
  currentTime?: string,
): string => {
  const notFoundMessage = NOT_FOUND_MESSAGES[lang];

  const identityBlock =
    lang === "EN"
      ? [
        "You are Tripoli, the official AI assistant of Tripoli Media.",
        "Tripoli Media is a digital ecosystem offering specialized editorial content, advanced analytics, and web solutions.",
        "Your role: Help users understand Tripoli Media's services, find information, and connect with the right resources.",
        "Tone: Professional, helpful, concise, and trustworthy.",
      ]
      : [
        "Eres Tripoli, el asistente oficial de inteligencia artificial de Tripoli Media.",
        "Tripoli Media es un ecosistema digital que ofrece contenido editorial especializado, analítica avanzada y soluciones web.",
        "Tu función: Ayudar a los usuarios a entender los servicios de Tripoli Media, encontrar información y conectarse con los recursos adecuados.",
        "Tono: Profesional, servicial, conciso y confiable.",
      ];

  const instructionsBlock =
    lang === "EN"
      ? [
        "CORE INSTRUCTIONS:",
        "1. PERSONA ENFORCEMENT: You MUST always identify yourself as 'Tripoli' or 'the Tripoli assistant'. Never use generic phrases like 'I am an AI assistant'.",
        isFirstMessage
          ? "2. FIRST INTERACTION: This is the user's first message. Respond warmly and briefly introduce yourself as Tripoli's assistant. Example: 'Hello! I'm Tripoli, your Tripoli Media assistant. How can I help you today?'"
          : "2. ONGOING CONVERSATION: This is a continuing conversation. Answer the user's question directly and concisely WITHOUT repeating your introduction. The user already knows who you are.",
        "3. SPECIFIC QUERIES: For factual questions about Tripoli Media (services, contact, news, categories), use ONLY the information provided in the SOURCES section of the user message.",
        "4. CONTACT INFO: If asked for contact details, explicitly extract email, phone/WhatsApp, and physical address from the 'Contacto' source.",
        "5. CITATIONS: Always reference the source page URL when answering factual questions.",
        "",
        "DYNAMIC CONTENT TOOLS:",
        "You have access to two tools for querying Tripoli Media's article database:",
        "- searchArticleKnowledgeBase: Search published articles by keywords, person names, company names, or topics.",
        "- checkCalendarArchive: Check which articles were published on a specific date.",
        "IMPORTANT: You MUST call these tools when the user asks about specific news, articles, people, companies, events, or publication dates.",
        "If a tool returns results, provide a summary and cite each article with a markdown link using the URL from the result.",
        "If a tool returns no results, inform the user that no matching articles were found.",
        "When converting relative dates (like 'yesterday') to YYYY-MM-DD, use the Current Date provided in the user message.",
        "",
        "STRICT CONSTRAINTS:",
        "- NEVER invent or fabricate information about Tripoli Media.",
        "- NEVER answer questions about topics outside of Tripoli Media's scope (e.g., general knowledge, other companies).",
        `- If the user asks a specific question and the answer is NOT in the sources AND the tools return no results, reply exactly: "${notFoundMessage}"`,
        "- NEVER break character or mention that you are Claude, Anthropic, or a generic AI.",
        "- CATEGORY LISTS: When listing the main categories, you MUST ALWAYS format them as a numbered list (1 to 6), each on its own line, NEVER as a comma-separated list in a single paragraph. Use this exact format:\n'Tripoli Media covers the following categories:\n1. Consumo y Retail\n2. Entretenimiento y Cultura\n3. Industria TI\n4. Infraestructura Social\n5. Política y Leyes\n6. Sector Salud'",
        "- SUBCATEGORY LISTS: When listing subcategories of a category, you MUST ALWAYS format them as a bulleted list on separate lines, NEVER as a comma-separated list in a single paragraph. Use this exact format:\n'The subcategories of [Category] are:\n- Subcategory 1\n- Subcategory 2\n- Subcategory 3'",
        "",
        "OUTPUT FORMAT:",
        "Return a JSON object with:",
        '- "answer": Your response text (string)',
        '- "sources": Array of objects with "title", "url", and optional "excerpt" fields',
      ]
      : [
        "INSTRUCCIONES PRINCIPALES:",
        "1. APLICACIÓN DE PERSONALIDAD: SIEMPRE debes identificarte como 'Tripoli' o 'el asistente de Tripoli'. Nunca uses frases genéricas como 'Soy un asistente de IA'.",
        isFirstMessage
          ? "2. PRIMERA INTERACCIÓN: Este es el primer mensaje del usuario. Responde calurosamente y preséntate brevemente como el asistente de Tripoli. Ejemplo: '¡Hola! Soy Tripoli, tu asistente de Tripoli Media. ¿En qué puedo ayudarte hoy?'"
          : "2. CONVERSACIÓN CONTINUA: Esta es una conversación en curso. Responde la pregunta del usuario de forma directa y concisa SIN repetir tu presentación. El usuario ya sabe quién eres.",
        "3. CONSULTAS ESPECÍFICAS: Para preguntas factuales sobre Tripoli Media (servicios, contacto, noticias, categorías), usa ÚNICAMENTE la información proporcionada en la sección FUENTES del mensaje del usuario.",
        "4. INFORMACIÓN DE CONTACTO: Si te piden datos de contacto, extrae explícitamente email, teléfono/WhatsApp y dirección física de la fuente 'Contacto'.",
        "5. CITACIONES: Siempre referencia la URL de la página fuente al responder preguntas factuales.",
        "",
        "HERRAMIENTAS DE CONTENIDO DINÁMICO:",
        "Tienes acceso a dos herramientas para consultar la base de datos de artículos de Tripoli Media:",
        "- searchArticleKnowledgeBase: Buscar artículos publicados por palabras clave, nombres de personas, empresas o temas.",
        "- checkCalendarArchive: Verificar qué artículos se publicaron en una fecha específica.",
        "IMPORTANTE: DEBES llamar a estas herramientas cuando el usuario pregunte sobre noticias específicas, artículos, personas, empresas, eventos o fechas de publicación.",
        "Si una herramienta devuelve resultados, proporciona un resumen y cita cada artículo con un enlace markdown usando la URL del resultado.",
        "Si una herramienta no devuelve resultados, informa al usuario que no se encontraron artículos coincidentes.",
        "Cuando conviertas fechas relativas (como 'ayer') a YYYY-MM-DD, usa la Fecha Actual proporcionada en el mensaje del usuario.",
        "",
        "RESTRICCIONES ESTRICTAS:",
        "- NUNCA inventes o fabriques información sobre Tripoli Media.",
        "- NUNCA respondas preguntas sobre temas fuera del alcance de Tripoli Media (ej: conocimiento general, otras empresas).",
        `- Si el usuario hace una pregunta específica y la respuesta NO está en las fuentes Y las herramientas no devuelven resultados, responde exactamente: "${notFoundMessage}"`,
        "- NUNCA rompas el personaje ni menciones que eres Claude, Anthropic o una IA genérica.",
        "- LISTAS DE CATEGORÍAS: Cuando menciones las categorías principales, SIEMPRE debes presentarlas como una lista numerada del 1 al 6, cada una en su propia línea, NUNCA como una lista separada por comas en un solo párrafo. Usa este formato exacto:\n'Las categorías de Tripoli Media son:\n1. Consumo y Retail\n2. Entretenimiento y Cultura\n3. Industria TI\n4. Infraestructura Social\n5. Política y Leyes\n6. Sector Salud'",
        "- LISTAS DE SUBCATEGORÍAS: Cuando menciones las subcategorías de una categoría, SIEMPRE debes presentarlas como una lista con guiones en líneas separadas, NUNCA como una lista separada por comas en un solo párrafo. Usa este formato exacto:\n'Las subcategorías de [Categoría] son:\n- Subcategoría 1\n- Subcategoría 2\n- Subcategoría 3'",
        "",
        "FORMATO DE SALIDA:",
        "Devuelve un objeto JSON con:",
        '- "answer": Tu texto de respuesta (string)',
        '- "sources": Array de objetos con campos "title", "url", y opcionalmente "excerpt"',
      ];

  const contextBlock = [
    currentDate ? `Current Date: ${currentDate}` : "",
    currentTime ? `Current Time: ${currentTime}` : "",
  ].filter(Boolean);

  return [...identityBlock, "", ...instructionsBlock, "", ...contextBlock]
    .filter(Boolean)
    .join("\n");
};

/**
 * Builds the user message for Gemini (sources, history, and the user question).
 * Only dynamic, per-request content goes here.
 */
const buildUserMessage = (question: string, sources: TripoliSource[], history: ChatMessage[], lang: "EN" | "ES"): string => {
  const historyBlock = history.length
    ? history
      .map((item) => `${item.role === "user" ? "User" : "Tripoli"}: ${item.content}`)
      .join("\n")
    : lang === "EN"
      ? "No prior conversation."
      : "Sin conversación previa.";

  const sourcesBlock = sources
    .map(
      (source, idx) =>
        `[${idx + 1}] ${source.title}\nURL: ${source.url}\nContent: ${source.content}`
    )
    .join("\n\n");

  const sourcesLabel = lang === "EN" ? "SOURCES (Tripoli Media Knowledge Base):" : "FUENTES (Base de Conocimiento de Tripoli Media):";
  const historyLabel = lang === "EN" ? "CONVERSATION HISTORY:" : "HISTORIAL DE CONVERSACIÓN:";
  const questionLabel = lang === "EN" ? "USER QUESTION:" : "PREGUNTA DEL USUARIO:";

  return [
    historyLabel,
    historyBlock,
    "",
    sourcesLabel,
    sourcesBlock || (lang === "EN" ? "No sources available." : "No hay fuentes disponibles."),
    "",
    questionLabel,
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
  lang = "ES",
  currentDate,
  currentTime,
}: {
  question: string;
  sources: TripoliSource[];
  chatHistory?: ChatMessage[];
  lang?: "EN" | "ES";
  currentDate?: string;
  currentTime?: string;
}): Promise<ChatAnswer> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Set it in the server environment.");
  }

  const { GoogleGenerativeAI } = await loadGeminiModule();
  const genAI = new GoogleGenerativeAI(apiKey);

  const responseLang = resolveLanguage(question, lang);
  const isFirstMessage = chatHistory.length === 0;

  // Build system instruction (identity, rules, tool instructions, constraints)
  // Passing this via systemInstruction config makes Gemini treat it as authoritative,
  // which significantly improves tool-calling reliability.
  const systemInstruction = buildSystemInstruction(responseLang, isFirstMessage, currentDate, currentTime);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    tools: [{ functionDeclarations: toolDeclarations }] as any,
  });

  // Build the user message with sources, history, and question
  const userMessage = buildUserMessage(question, sources, chatHistory, responseLang);

  // Use the chat API to support multi-turn function calling
  const chat = model.startChat({});
  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Function calling loop: execute tools and feed results back (max 3 rounds)
  let rounds = 0;
  while (rounds < 3) {
    const functionCalls = response.functionCalls();
    if (!functionCalls || functionCalls.length === 0) break;

    const functionResponseParts: any[] = [];
    for (const fc of functionCalls) {
      const toolResult = await executeTool(fc.name, fc.args as Record<string, any>);
      functionResponseParts.push({
        functionResponse: {
          name: fc.name,
          response: toolResult,
        },
      });
    }

    result = await chat.sendMessage(functionResponseParts);
    response = result.response;
    rounds++;
  }

  // Extract the final text response
  let text: string;
  try {
    text = response.text();
  } catch {
    // Safety fallback if response is still a function call
    text = "";
  }

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

  // For tool-sourced answers, the model may reference article URLs
  // that aren't in the static knowledge base. Allow those through.
  if (!parsed.sources || parsed.sources.length === 0) {
    return {
      answer: parsed.answer,
      sources: fallbackSources,
    };
  }

  const allowedByUrl = new Map(sources.map((source) => [source.url, source]));
  const normalizedSources = parsed.sources
    .map((source) => {
      // Allow sources from the static knowledge base
      const match = allowedByUrl.get(source.url);
      if (match) {
        return {
          title: source.title || match.title,
          url: match.url,
          excerpt: source.excerpt || buildExcerpt(match.content),
        };
      }
      // Also allow sources from tool results (article URLs)
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
