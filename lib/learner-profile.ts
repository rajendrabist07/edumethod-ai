import { supabaseAdmin } from "@/lib/supabase-admin";
import { aiGateway } from "@/lib/ai/gateway";
import { calculateMasteryScore } from "@/lib/spaced-repetition";

export interface RecentMistake {
  topic: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  misconception: string;
  timestamp: string;
}

export type ExplanationStyle = "socratic" | "concise" | "detailed" | "conversational" | "balanced";

export interface LearnerProfile {
  user_id: string;
  mastery_scores: Record<string, number>; // Topic -> score percentage (0-100)
  recent_mistakes: RecentMistake[];
  preferred_explanation_style: ExplanationStyle;
  study_times: Record<string, number>; // Subject -> total study duration in seconds
  updated_at: string;
}

export const DEFAULT_LEARNER_PROFILE: Omit<LearnerProfile, "user_id"> = {
  mastery_scores: {},
  recent_mistakes: [],
  preferred_explanation_style: "balanced",
  study_times: {},
  updated_at: new Date().toISOString(),
};

/**
 * Retrieves the learner profile from Supabase for a given user.
 * Returns default values if profile is missing or on database error.
 */
export async function getOrCreateLearnerProfile(userId: string): Promise<LearnerProfile> {
  try {
    const { data, error } = await supabaseAdmin
      .from("learner_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching learner profile:", error);
    }

    if (data) {
      return {
        user_id: data.user_id,
        mastery_scores: data.mastery_scores || {},
        recent_mistakes: data.recent_mistakes || [],
        preferred_explanation_style: (data.preferred_explanation_style as ExplanationStyle) || "balanced",
        study_times: data.study_times || {},
        updated_at: data.updated_at || new Date().toISOString(),
      };
    }

    const newProfile: LearnerProfile = {
      user_id: userId,
      ...DEFAULT_LEARNER_PROFILE,
      updated_at: new Date().toISOString(),
    };

    // Upsert default profile for future calls
    await supabaseAdmin
      .from("learner_profiles")
      .upsert(newProfile, { onConflict: "user_id" });

    return newProfile;
  } catch (err) {
    console.error("Failed to get or create learner profile:", err);
    return {
      user_id: userId,
      ...DEFAULT_LEARNER_PROFILE,
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Updates specific fields in a user's learner profile.
 */
export async function updateLearnerProfile(
  userId: string,
  updates: Partial<Omit<LearnerProfile, "user_id">>
): Promise<LearnerProfile> {
  const current = await getOrCreateLearnerProfile(userId);

  const updatedProfile: LearnerProfile = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("learner_profiles")
      .upsert(updatedProfile, { onConflict: "user_id" });

    if (error) {
      console.error("Error updating learner profile:", error);
    }
  } catch (err) {
    console.error("Database exception updating learner profile:", err);
  }

  return updatedProfile;
}

/**
 * Uses AI to analyze a student's incorrect multiple-choice answer
 * and generate a concise description of their specific misconception.
 */
export async function identifyMisconception(
  question: string,
  options: string[],
  studentAnswerIndex: number,
  correctIndex: number,
  userId: string
): Promise<string> {
  const studentChoice = options[studentAnswerIndex] || "Unknown answer";
  const correctChoice = options[correctIndex] || "Correct answer";

  try {
    const result = await aiGateway.chat(
      {
        messages: [
          {
            role: "system",
            content:
              "You are a pedagogical diagnostic expert. Analyze the student's incorrect answer in a multiple-choice question. Identify the exact core misconception or reasoning error made by choosing this answer. Return a single concise sentence (max 15 words). Be direct, clear, and specific. Do NOT return quotation marks or intro text.",
          },
          {
            role: "user",
            content: `Question: ${question}\nOptions: ${JSON.stringify(options)}\nStudent Selected Answer: ${studentChoice}\nCorrect Answer: ${correctChoice}`,
          },
        ],
      },
      userId,
      [{ provider: "groq", model: "llama-3.1-8b-instant" }]
    );

    const misconception = result.text.trim().replace(/^["']|["']$/g, "");
    return misconception || `Mistook ${studentChoice} for ${correctChoice}.`;
  } catch (err) {
    console.warn("AI misconception analysis failed, using fallback:", err);
    return `Confused concept around ${studentChoice} vs correct option ${correctChoice}.`;
  }
}

/**
 * Automatically updates learner profile after a quiz submission:
 * 1. Adjusts per-topic mastery scores (up for correct, down for incorrect).
 * 2. Uses AI to diagnose misconceptions for incorrect answers and logs them in recent_mistakes.
 * 3. Increments total study time for the subject.
 */
export async function recordQuizSubmission(
  userId: string,
  quizId: string,
  answers: number[]
): Promise<void> {
  try {
    // 1. Fetch quiz
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("user_id", userId)
      .single();

    if (!quiz) return;

    // 2. Fetch subject from learning path
    let subject = "General Knowledge";
    if (quiz.learning_path_id) {
      const { data: lp } = await supabaseAdmin
        .from("learning_paths")
        .select("subject")
        .eq("id", quiz.learning_path_id)
        .maybeSingle();

      if (lp?.subject) {
        subject = lp.subject;
      }
    }

    const questions = (quiz.questions || []) as {
      question: string;
      options: string[];
      correctIndex: number;
      topic: string;
    }[];

    const profile = await getOrCreateLearnerProfile(userId);
    const masteryScores = { ...profile.mastery_scores };
    const recentMistakes = [...profile.recent_mistakes];
    const studyTimes = { ...profile.study_times };

    const newMistakes: RecentMistake[] = [];

    // Process questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const studentAns = answers[i];
      const topicName = q.topic || subject;
      const isCorrect = studentAns === q.correctIndex;

      const currentTopicMastery = masteryScores[topicName] ?? 50;

      if (isCorrect) {
        masteryScores[topicName] = Math.min(100, currentTopicMastery + 6);
      } else {
        masteryScores[topicName] = Math.max(0, currentTopicMastery - 8);

        // Identify specific misconception with AI
        const misconception = await identifyMisconception(
          q.question,
          q.options,
          studentAns,
          q.correctIndex,
          userId
        );

        newMistakes.push({
          topic: topicName,
          question: q.question,
          studentAnswer: q.options[studentAns] || "Unanswered",
          correctAnswer: q.options[q.correctIndex] || "",
          misconception,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Prepend new mistakes, keeping max 15 recent mistakes
    const updatedMistakes = [...newMistakes, ...recentMistakes].slice(0, 15);

    // Add estimated study time (30s per question = 150s for 5-question quiz)
    const addedSeconds = Math.max(60, questions.length * 30);
    studyTimes[subject] = (studyTimes[subject] || 0) + addedSeconds;

    await updateLearnerProfile(userId, {
      mastery_scores: masteryScores,
      recent_mistakes: updatedMistakes,
      study_times: studyTimes,
    });
  } catch (err) {
    console.error("Failed to record quiz submission in learner profile:", err);
  }
}

/**
 * Automatically updates learner profile after a flashcard review:
 * 1. Calculates updated deck mastery score using SM-2 metrics.
 * 2. Registers memory lapse in recent_mistakes if rating is "again".
 * 3. Increments total study time for the subject.
 */
export async function recordFlashcardReview(
  userId: string,
  cardId: string,
  rating: "again" | "hard" | "good" | "easy"
): Promise<void> {
  try {
    // 1. Fetch card details
    const { data: card } = await supabaseAdmin
      .from("flashcards")
      .select("front, back, deck_id")
      .eq("id", cardId)
      .eq("user_id", userId)
      .single();

    if (!card) return;

    // 2. Fetch deck metadata
    const { data: deck } = await supabaseAdmin
      .from("flashcard_decks")
      .select("id, topic, subject")
      .eq("id", card.deck_id)
      .single();

    if (!deck) return;

    // 3. Fetch all cards in deck to compute deck-level mastery
    const { data: allCards } = await supabaseAdmin
      .from("flashcards")
      .select("repetitions, ease_factor")
      .eq("deck_id", deck.id);

    let deckMastery = 0;
    if (allCards && allCards.length > 0) {
      let totalReps = 0;
      let totalEase = 0;
      allCards.forEach((c) => {
        totalReps += c.repetitions || 0;
        totalEase += c.ease_factor || 2.5;
      });
      deckMastery = calculateMasteryScore(
        totalReps / allCards.length,
        totalEase / allCards.length
      );
    }

    const profile = await getOrCreateLearnerProfile(userId);
    const masteryScores = { ...profile.mastery_scores };
    const recentMistakes = [...profile.recent_mistakes];
    const studyTimes = { ...profile.study_times };

    masteryScores[deck.topic] = deckMastery;

    // Log failure if rating is "again"
    if (rating === "again") {
      const mistake: RecentMistake = {
        topic: deck.topic,
        question: card.front,
        studentAnswer: "Active Recall Failure (Rated Again)",
        correctAnswer: card.back,
        misconception: "Struggled with immediate retrieval of concept during flashcard review.",
        timestamp: new Date().toISOString(),
      };
      recentMistakes.unshift(mistake);
    }

    // Keep top 15 recent mistakes
    const trimmedMistakes = recentMistakes.slice(0, 15);

    // Add 15 seconds of study time for this subject
    studyTimes[deck.subject] = (studyTimes[deck.subject] || 0) + 15;

    await updateLearnerProfile(userId, {
      mastery_scores: masteryScores,
      recent_mistakes: trimmedMistakes,
      study_times: studyTimes,
    });
  } catch (err) {
    console.error("Failed to record flashcard review in learner profile:", err);
  }
}

/**
 * Automatically updates learner profile during a doubt session interaction:
 * 1. Detects and updates preferred explanation style based on mode flags.
 * 2. Increments total study time for the active subject.
 */
export async function recordDoubtSessionInteraction(
  userId: string,
  subject?: string | null,
  options?: {
    effort?: "low" | "medium" | "high" | "extra";
    socratic?: boolean;
    isVoiceMode?: boolean;
  }
): Promise<void> {
  try {
    const profile = await getOrCreateLearnerProfile(userId);
    const updates: Partial<Omit<LearnerProfile, "user_id">> = {};

    // Detect explanation style
    if (options?.socratic) {
      updates.preferred_explanation_style = "socratic";
    } else if (options?.isVoiceMode) {
      updates.preferred_explanation_style = "conversational";
    } else if (options?.effort === "low") {
      updates.preferred_explanation_style = "concise";
    } else if (options?.effort === "high" || options?.effort === "extra") {
      updates.preferred_explanation_style = "detailed";
    }

    // Update study time if subject is known
    if (subject) {
      const studyTimes = { ...profile.study_times };
      studyTimes[subject] = (studyTimes[subject] || 0) + 60; // 1 minute per chat turn
      updates.study_times = studyTimes;
    }

    if (Object.keys(updates).length > 0) {
      await updateLearnerProfile(userId, updates);
    }
  } catch (err) {
    console.error("Failed to record doubt session interaction:", err);
  }
}
