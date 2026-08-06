import { aiGateway } from "./gateway";
import { LearnerProfile } from "@/lib/learner-profile";

export async function runCognitivePipeline({
  message,
  history,
  context,
  userId,
  learnerProfile,
}: {
  message: string;
  history: any[];
  context: string;
  userId: string;
  learnerProfile?: LearnerProfile | null;
}): Promise<string> {
  const profileContext = learnerProfile
    ? `\n\nSTUDENT LEARNING PROFILE:
- Preferred Explanation Style: ${learnerProfile.preferred_explanation_style || "balanced"}
- Per-Topic Mastery Scores: ${JSON.stringify(learnerProfile.mastery_scores || {})}
- Recent Misconceptions & Lapses: ${JSON.stringify(
        (learnerProfile.recent_mistakes || []).slice(0, 3).map((m) => ({
          topic: m.topic,
          question: m.question,
          misconception: m.misconception,
        }))
      )}`
    : "";

  // 1. STRATEGIST
  // Pure logic, step-by-step reasoning on how to solve the problem.
  const strategyResult = await aiGateway.chat(
    {
      messages: [
        {
          role: "system",
          content: "You are the Strategist. Analyze the student's question and any provided syllabus context. Create a step-by-step logical plan to solve the doubt accurately. Focus strictly on the logic/math/facts, not the final pedagogical tone. Be extremely concise.",
        },
        {
          role: "user",
          content: `Question: ${message}\nContext: ${context}${profileContext}`,
        },
      ],
    },
    userId,
    [{ provider: "groq", model: "llama-3.1-8b-instant" }] // Extremely fast model for strategy
  );

  const strategy = strategyResult.text;

  // 2. GENERATOR
  // Uses the strategy to generate the pedagogical, tone-matched response.
  const generatorResult = await aiGateway.chat(
    {
      messages: [
        {
          role: "system",
          content: `You are the Generator, an elite empathetic tutor. Use the provided Strategy Plan to write a clear, highly engaging, and pedagogical explanation for the student. Maintain a supportive tone. Adapt your explanation to match the student's preferred style (${learnerProfile?.preferred_explanation_style || "balanced"}) and address any known misconceptions if relevant.`,
        },
        ...history.map((m: any) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        {
          role: "user",
          content: `Student Question: ${message}\nStrategy Plan:\n${strategy}${profileContext}\n\nPlease generate the final explanation based on the strategy.`,
        },
      ],
    },
    userId,
    [{ provider: "groq", model: "llama-3.3-70b-versatile" }, { provider: "gemini", model: "gemini-1.5-flash-latest" }]
  );

  const generatedResponse = generatorResult.text || "I'm sorry, I couldn't generate an explanation at this time.";

  // 3. VERIFIER
  // Rapidly checks for hallucinations or math errors in the generated response vs the strategy.
  const verifierResult = await aiGateway.chat(
    {
      messages: [
        {
          role: "system",
          content: "You are the Verifier. Review the Generator's Output against the Strategy Plan. Does the output hallucinate, make a math error, or deviate negatively from the strategy? Respond with ONLY a JSON object: { \"pass\": boolean, \"reason\": \"string\" }",
        },
        {
          role: "user",
          content: `Strategy: ${strategy}\n\nOutput: ${generatedResponse}`,
        },
      ],
      jsonMode: true,
    },
    userId,
    [{ provider: "groq", model: "llama-3.1-8b-instant" }]
  );

  let passed = true;
  try {
    const vData = JSON.parse(verifierResult.text || "{}");
    if (vData.pass === false) {
      passed = false;
      console.warn("Verifier flagged generation:", vData.reason);
    }
  } catch (e) {
    console.error("Verifier JSON parse failed", e);
  }

  if (!passed) {
    console.log("Cognitive Pipeline: Verifier failed, regenerating once...");
    const retryResult = await aiGateway.chat(
      {
        messages: [
          {
            role: "system",
            content: "You are the Generator. Your previous explanation had errors. Use the Strategy Plan to write a perfectly accurate explanation. Double-check your math and logic.",
          },
          {
            role: "user",
            content: `Student Question: ${message}\nStrategy Plan:\n${strategy}\n\nPlease generate the corrected final explanation.`,
          },
        ],
      },
      userId,
      [{ provider: "groq", model: "llama-3.3-70b-versatile" }]
    );
    return retryResult.text || generatedResponse;
  }

  return generatedResponse;
}

