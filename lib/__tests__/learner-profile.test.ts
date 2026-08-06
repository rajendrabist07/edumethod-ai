import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrCreateLearnerProfile, updateLearnerProfile, DEFAULT_LEARNER_PROFILE } from "../learner-profile";
import { supabaseAdmin } from "../supabase-admin";

vi.mock("../supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("Learner Profile Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default profile if database returns no record", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(supabaseAdmin.from).mockImplementation(mockFrom as any);

    const profile = await getOrCreateLearnerProfile("user_test_123");

    expect(profile.user_id).toBe("user_test_123");
    expect(profile.preferred_explanation_style).toBe("balanced");
    expect(profile.mastery_scores).toEqual({});
  });

  it("should merge updates correctly into existing profile", async () => {
    const existingData = {
      user_id: "user_test_123",
      mastery_scores: { Biology: 80 },
      recent_mistakes: [],
      preferred_explanation_style: "socratic",
      study_times: { Biology: 300 },
      updated_at: "2026-08-06T12:00:00Z",
    };

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: existingData, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(supabaseAdmin.from).mockImplementation(mockFrom as any);

    const updated = await updateLearnerProfile("user_test_123", {
      preferred_explanation_style: "detailed",
      mastery_scores: { Biology: 85, Math: 60 },
    });

    expect(updated.preferred_explanation_style).toBe("detailed");
    expect(updated.mastery_scores).toEqual({ Biology: 85, Math: 60 });
    expect(updated.study_times).toEqual({ Biology: 300 });
  });
});
