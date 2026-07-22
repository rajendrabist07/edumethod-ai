import { describe, it, expect } from "vitest";
import { chunkText } from "../ai/embeddings";

describe("Text Chunking Helper", () => {
  it("should return empty array for empty inputs", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("should split content into chunks of correct size", () => {
    const text = "one two three four five six seven eight nine ten";
    const chunks = chunkText(text, 4, 1);
    
    // Chunk 1: one two three four
    // Chunk 2 (starts at index 3: 4 - 1): four five six seven
    // Chunk 3 (starts at index 6: 7 - 1): seven eight nine ten
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toBe("one two three four");
    expect(chunks[1]).toBe("four five six seven");
    expect(chunks[2]).toBe("seven eight nine ten");
  });

  it("should return single chunk if total word count is smaller than chunk size", () => {
    const text = "one two three";
    const chunks = chunkText(text, 10, 2);
    expect(chunks).toEqual(["one two three"]);
  });
});
