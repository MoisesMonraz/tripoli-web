import { NextRequest, NextResponse } from "next/server";

// In-memory cache for translations (persists during server lifetime)
const translationCache = new Map<string, string>();

let cachedGeminiModule: typeof import("@google/generative-ai") | null = null;
const loadGeminiModule = async () => {
    if (!cachedGeminiModule) {
        cachedGeminiModule = await import("@google/generative-ai");
    }
    return cachedGeminiModule;
};

/**
 * POST /api/translate
 * Body: { texts: string[], targetLang: "EN" | "ES" }
 * Returns: { translations: string[] }
 * 
 * Translates an array of texts using Gemini, with caching for performance.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { texts, targetLang = "EN" } = body;

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid 'texts' array" },
                { status: 400 }
            );
        }

        if (texts.length > 20) {
            return NextResponse.json(
                { error: "Maximum 20 texts per request" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Translation service not configured" },
                { status: 500 }
            );
        }

        // Check cache first
        const results: string[] = [];
        const textsToTranslate: { index: number; text: string }[] = [];

        texts.forEach((text, index) => {
            const cacheKey = `${targetLang}:${text}`;
            const cached = translationCache.get(cacheKey);
            if (cached) {
                results[index] = cached;
            } else {
                textsToTranslate.push({ index, text });
            }
        });

        // If all cached, return immediately
        if (textsToTranslate.length === 0) {
            return NextResponse.json({ translations: results });
        }

        // Translate uncached texts
        const { GoogleGenerativeAI } = await loadGeminiModule();
        const genAI = new GoogleGenerativeAI(apiKey);

        const sourceLang = targetLang === "EN" ? "Spanish" : "English";
        const targetLangFull = targetLang === "EN" ? "English" : "Spanish";

        const systemInstruction = `You are a professional translator specializing in news headlines and article titles.
Translate from ${sourceLang} to ${targetLangFull}.

RULES:
1. Keep proper nouns unchanged (company names, brand names, person names, place names)
2. Maintain the journalistic style and impact of the headline
3. Keep the translation concise and natural
4. Do NOT add explanations or notes
5. Return ONLY the JSON array with translations, nothing else

INPUT: An array of texts to translate
OUTPUT: A JSON array of translated strings in the same order

Example:
Input: ["El Orgullo del Pacífico: La Expansión Regional de Kiosko", "Volkswagen presenta nuevo modelo eléctrico"]
Output: ["The Pride of the Pacific: Kiosko's Regional Expansion", "Volkswagen unveils new electric model"]`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
        });

        const textsForAI = textsToTranslate.map(t => t.text);
        const prompt = `Translate these texts:\n${JSON.stringify(textsForAI, null, 2)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON response
        let translations: string[] = [];
        try {
            // Extract JSON array from response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                translations = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Fallback: return original texts if parsing fails
            translations = textsForAI;
        }

        // Map translations back and cache them
        textsToTranslate.forEach((item, i) => {
            const translation = translations[i] || item.text;
            results[item.index] = translation;

            // Cache the translation
            const cacheKey = `${targetLang}:${item.text}`;
            translationCache.set(cacheKey, translation);
        });

        return NextResponse.json({ translations: results });

    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: "Translation failed" },
            { status: 500 }
        );
    }
}
