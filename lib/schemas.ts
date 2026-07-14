import { z } from "zod";

export const topicSchema = z.object({
  subject: z.string(),
  topics: z.array(
    z.object({
      name: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      estimatedHours: z.number(),
    })
  ),
});