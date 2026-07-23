import { describe, it, expect } from "vitest";
import { z } from "zod";

const responseSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  gaps: z.array(z.string()),
  suggestions: z.array(z.string()),
});

describe("Feynman Technique AI Schema Validation", () => {
  it("should validate a correct AI response payload", () => {
    const validPayload = {
      clarityScore: 85,
      gaps: ["Missed mentioning cellular respiration energy outputs."],
      suggestions: ["Incorporate ATP synthesis into the cell explanation."],
    };

    const parsed = responseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.clarityScore).toBe(85);
      expect(parsed.data.gaps).toHaveLength(1);
    }
  });

  it("should fail validation if score is out of boundaries", () => {
    const invalidPayload = {
      clarityScore: 120, // max is 100
      gaps: [],
      suggestions: [],
    };

    const parsed = responseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should fail validation if gaps is not an array", () => {
    const invalidPayload = {
      clarityScore: 75,
      gaps: "no gaps found", // should be array
      suggestions: [],
    };

    const parsed = responseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});
