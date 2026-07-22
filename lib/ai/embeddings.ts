import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Splitting text content into overlapping chunks to feed the RAG pgvector pipeline.
 * Uses a word-based boundary window with customizable size and overlap.
 */
export function chunkText(text: string, chunkSizeWord = 100, overlapWord = 20): string[] {
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
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    console.error("[Gemini Embedding Error]:", error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}
