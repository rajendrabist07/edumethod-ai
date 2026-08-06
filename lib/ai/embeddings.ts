import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Splitting text content into overlapping chunks to feed the RAG pgvector pipeline.
 * Uses a word-based boundary window with customizable size (~500 tokens / 350 words) and overlap (50 words).
 */
export function chunkText(text: string, chunkSizeWord = 350, overlapWord = 50): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  
  if (words.length === 0 || words[0] === "") return [];

  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSizeWord);
    chunks.push(chunkWords.join(" "));
    
    if (i + chunkSizeWord >= words.length) {
      break;
    }
    
    i += (chunkSizeWord - overlapWord);
  }

  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Queries Gemini's text-embedding-004 model to generate 768-dimension vectors for raw content.
 * Returns null gracefully if API key is missing or quota limits are exceeded.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[Gemini Embedding Notice]: GEMINI_API_KEY is not set. Skipping vector embedding.");
    return null;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding?.values || null;
  } catch (error: any) {
    console.warn("[Gemini Embedding Notice]: Vector embedding unavailable (quota/rate-limit):", error?.message || String(error));
    return null;
  }
}
