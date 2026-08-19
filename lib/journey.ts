import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";

export interface RoadmapTopicItem {
  name: string;
  order: number;
  difficulty: "easy" | "medium" | "hard";
  estimatedHours: number;
  dependencies: string[];
  masteryScore: number;
  completed: boolean;
  sm2DueStatus: "due_today text-amber-500 font-bold" | "scheduled" | "no_deck";
  nextReviewDate: string | null;
  masteryGatingReason?: string;
}

/**
 * PEDAGOGICAL PRINCIPLE 4: Mastery Gating, Not Time Gating.
 * Holds topics in progress until N correct reviews are verified across >= 2 separate sessions.
 */
export function evaluateMasteryGating(input: {
  masteryScore: number;
  distinctSessionCount: number;
}): { isMastered: boolean; gatingReason: string } {
  const { masteryScore, distinctSessionCount } = input;
  if (masteryScore >= 75 && distinctSessionCount >= 2) {
    return { isMastered: true, gatingReason: "Mastery achieved across multi-session spaced retrieval!" };
  }
  if (masteryScore >= 75 && distinctSessionCount < 2) {
    return {
      isMastered: false,
      gatingReason: "PEDAGOGICAL PRINCIPLE 4 (MASTERY GATING): High score in one sitting! 1 more review needed spaced 24 hours apart to verify long-term retention.",
    };
  }
  const remainingScore = Math.max(0, 75 - masteryScore);
  return {
    isMastered: false,
    gatingReason: `In Progress: ${remainingScore}% additional mastery needed across spaced sessions.`,
  };
}

export interface PersistentRoadmap {
  id: string;
  subject: string;
  createdAt: string;
  completionPercentage: number;
  topics: RoadmapTopicItem[];
}

export interface JourneyOverview {
  totalRoadmaps: number;
  totalTopics: number;
  completedTopics: number;
  overallCompletionPercentage: number;
  currentStreak: number;
  nextScheduledReview: string | null;
  dueReviewsCount: number;
  roadmaps: PersistentRoadmap[];
}

/**
 * Pure-logic deterministic function calculating consecutive active calendar days (streak).
 */
export function calculateStreak(activityDates: (string | Date)[]): number {
  if (!activityDates || activityDates.length === 0) return 0;

  // Convert all dates to YYYY-MM-DD UTC strings
  const dateStrings = Array.from(
    new Set(
      activityDates
        .map((d) => {
          const dateObj = typeof d === "string" ? new Date(d) : d;
          if (isNaN(dateObj.getTime())) return null;
          return dateObj.toISOString().split("T")[0];
        })
        .filter((d): d is string => d !== null)
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending

  if (dateStrings.length === 0) return 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayObj = new Date();
  yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split("T")[0];

  // If neither today nor yesterday has activity, streak is broken (0)
  if (!dateStrings.includes(todayStr) && !dateStrings.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  const checkDate = dateStrings.includes(todayStr) ? new Date() : yesterdayObj;

  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (dateStrings.includes(checkStr)) {
      streak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Aggregates all DB-stored roadmaps, SM-2 flashcard schedules, and progress streak for a user.
 */
export async function getUserJourneyOverview(userId: string): Promise<JourneyOverview> {
  try {
    // 1. Fetch persistent learning paths from DB
    const { data: paths } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 2. Fetch learner profile for mastery scores
    const profile = await getOrCreateLearnerProfile(userId);
    const masteryScores = profile.mastery_scores || {};

    // 3. Fetch SM-2 flashcard decks & schedules
    const { data: decks } = await supabaseAdmin
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", userId);

    // Map deck next_review by subject/topic
    const deckScheduleMap = new Map<string, { nextReview: string; dueNow: boolean }>();
    let dueDecksCount = 0;
    let earliestNextReview: Date | null = null;
    const now = new Date();

    if (decks && decks.length > 0) {
      for (const deck of decks) {
        if (deck.next_review) {
          const revDate = new Date(deck.next_review);
          const isDue = revDate <= now;
          if (isDue) dueDecksCount++;
          if (!earliestNextReview || revDate < earliestNextReview) {
            earliestNextReview = revDate;
          }
          deckScheduleMap.set(deck.subject.toLowerCase(), {
            nextReview: deck.next_review,
            dueNow: isDue,
          });
        }
      }
    }

    // 4. Fetch activity timestamps for streak calculation
    const [logsRes, doubtRes, quizRes] = await Promise.all([
      supabaseAdmin.from("ai_verification_logs").select("created_at").eq("user_id", userId),
      supabaseAdmin.from("doubt_sessions").select("created_at").eq("user_id", userId),
      supabaseAdmin.from("quizzes").select("created_at").eq("user_id", userId),
    ]);

    const activityDates: string[] = [
      profile.updated_at,
      ...(logsRes.data || []).map((l) => l.created_at),
      ...(doubtRes.data || []).map((d) => d.created_at),
      ...(quizRes.data || []).map((q) => q.created_at),
    ];

    const currentStreak = calculateStreak(activityDates);

    // 5. Format Persistent Roadmaps
    let totalTopicsCount = 0;
    let completedTopicsCount = 0;

    const formattedRoadmaps: PersistentRoadmap[] = (paths || []).map((p) => {
      const rawTopics: any[] = Array.isArray(p.topics) ? p.topics : [];
      totalTopicsCount += rawTopics.length;

      let pathCompletedTopics = 0;

      const formattedTopics: RoadmapTopicItem[] = rawTopics.map((t, idx) => {
        const topicName = typeof t === "string" ? t : t.name || `Topic ${idx + 1}`;
        const score = masteryScores[topicName] || 0;
        const gating = evaluateMasteryGating({
          masteryScore: score,
          distinctSessionCount: currentStreak >= 2 ? 2 : 1,
        });

        const isCompleted = gating.isMastered;

        if (isCompleted) {
          completedTopicsCount++;
          pathCompletedTopics++;
        }

        const deckInfo = deckScheduleMap.get(p.subject.toLowerCase());
        let sm2Status: "due_today text-amber-500 font-bold" | "scheduled" | "no_deck" = "no_deck";
        let nextRevStr: string | null = null;

        if (deckInfo) {
          sm2Status = deckInfo.dueNow ? "due_today text-amber-500 font-bold" : "scheduled";
          nextRevStr = deckInfo.nextReview;
        }

        return {
          name: topicName,
          order: idx + 1,
          difficulty: typeof t === "object" && t.difficulty ? t.difficulty : "medium",
          estimatedHours: typeof t === "object" && t.estimatedHours ? t.estimatedHours : 2,
          dependencies: typeof t === "object" && Array.isArray(t.dependencies) ? t.dependencies : [],
          masteryScore: score,
          completed: isCompleted,
          sm2DueStatus: sm2Status,
          nextReviewDate: nextRevStr,
          masteryGatingReason: gating.gatingReason,
        };
      });

      const pathCompletionPct =
        rawTopics.length > 0 ? Math.round((pathCompletedTopics / rawTopics.length) * 100) : 0;

      return {
        id: p.id,
        subject: p.subject,
        createdAt: p.created_at,
        completionPercentage: pathCompletionPct,
        topics: formattedTopics,
      };
    });

    const overallPct =
      totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    return {
      totalRoadmaps: formattedRoadmaps.length,
      totalTopics: totalTopicsCount,
      completedTopics: completedTopicsCount,
      overallCompletionPercentage: overallPct,
      currentStreak,
      nextScheduledReview: earliestNextReview ? earliestNextReview.toISOString() : null,
      dueReviewsCount: dueDecksCount,
      roadmaps: formattedRoadmaps,
    };
  } catch (err) {
    console.error("Error generating user journey overview:", err);
    return {
      totalRoadmaps: 0,
      totalTopics: 0,
      completedTopics: 0,
      overallCompletionPercentage: 0,
      currentStreak: 0,
      nextScheduledReview: null,
      dueReviewsCount: 0,
      roadmaps: [],
    };
  }
}
