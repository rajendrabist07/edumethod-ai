import { aiGateway } from "./gateway";
import { LearnerProfile } from "@/lib/learner-profile";
import {
  AdaptiveTeachingStrategy,
  determineTeachingStrategy,
  STRATEGY_PROMPT_INSTRUCTIONS,
} from "./adaptive-strategy";

export async function runCognitivePipeline({
  message,
  history,
  context,
  userId,
  learnerProfile,
  teachingStrategy,
}: {
  message: string;
  history: any[];
  context: string;
  userId: string;
  learnerProfile?: LearnerProfile | null;
  teachingStrategy?: AdaptiveTeachingStrategy;
}): Promise<string> {
  const activeStrategy =
    teachingStrategy ||
    determineTeachingStrategy({
      userPreference: learnerProfile?.preferred_explanation_style,
      recentMistakesCount: learnerProfile?.recent_mistakes?.length || 0,
    });

  const strategyDetails = STRATEGY_PROMPT_INSTRUCTIONS[activeStrategy];

  const profileContext = learnerProfile
    ? `\n\nSTUDENT LEARNING PROFILE:
- Active Teaching Strategy: ${strategyDetails.label} (${activeStrategy})
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
          content: `You are the Strategist. Analyze the student's question and any provided syllabus context. Create a step-by-step logical plan to solve the doubt accurately.\n\n${strategyDetails.promptInstruction}`,
        },
        {
          role: "user",
          content: `Question: ${message}\nContext: ${context}${profileContext}`,
        },
      ],
    },
    userId,
    [
      { provider: "groq", model: "llama-3.1-8b-instant" },
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "gemini", model: "gemini-2.5-flash" },
      { provider: "gemini", model: "gemini-1.5-flash" },
    ]
  );

  const strategy = strategyResult.text;

  // 2. GENERATOR
  // Uses the strategy to generate the pedagogical, tone-matched response.
  const generatorResult = await aiGateway.chat(
    {
      messages: [
        {
          role: "system",
          content: `You are EduMethod AI — a focused, encouraging AI tutor who explains one thing at a time with clarity and restraint. Use the provided Strategy Plan to write a clear, 100% accurate explanation.

--- MANDATORY RESPONSE FORMATTING RULES ---
- Use Markdown: headers (## or ###) for multi-part answers, bold for key terms the student should remember, bullet points for 3+ items, numbered lists for sequential steps.
- Use fenced code blocks or standard LaTeX ($...$ for inline, $$...$$ for block) for any math, code, or formula — never inline plain text for these.
- Leave a blank line between logical sections — never produce a dense unbroken paragraph longer than ~3 sentences.
- Use at most 1-2 relevant emoji per response, placed ONLY at section starts as visual anchors (e.g. "💡 Key idea", "⚠️ Common mistake", "✅ Check your understanding") — never mid-sentence, never decoratively.
- For worked examples: number each step, show reasoning for that step in one short line, then state the result.
- End multi-step answers with a one-line summary, not a repeat of the whole explanation.
- Never pad an answer to seem thorough — if the honest answer is short, give the short answer cleanly.

${strategyDetails.promptInstruction}\n\nAddress any known student misconceptions if relevant.`,
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
    [
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "groq", model: "llama-3.1-8b-instant" },
      { provider: "gemini", model: "gemini-2.5-flash" },
      { provider: "gemini", model: "gemini-1.5-flash" },
    ]
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
    [
      { provider: "groq", model: "llama-3.1-8b-instant" },
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "gemini", model: "gemini-2.5-flash" },
      { provider: "gemini", model: "gemini-1.5-flash" },
    ]
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
      [
        { provider: "groq", model: "llama-3.3-70b-versatile" },
        { provider: "groq", model: "llama-3.1-8b-instant" },
        { provider: "gemini", model: "gemini-2.5-flash" },
      { provider: "gemini", model: "gemini-1.5-flash" },
      ]
    );
    return retryResult.text || generatedResponse;
  }

  return generatedResponse;
}

