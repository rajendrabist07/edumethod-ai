import { describe, it, expect } from "vitest";

function formatSM2ReviewReason(
  daysSinceLastReview: number,
  easinessFactor: number,
  repetitions: number,
  isDue: boolean
): string {
  if (isDue) {
    return `due for review — last correct ${daysSinceLastReview} days ago, easiness factor ${easinessFactor.toFixed(1)}, ${repetitions} repetitions`;
  }
  return `scheduled for review — last reviewed ${daysSinceLastReview} days ago, easiness factor ${easinessFactor.toFixed(1)}`;
}

describe("System Transparency & SM-2 Review Explanations", () => {
  it("should format honest SM-2 review scheduled explanation strings", () => {
    const reasonDue = formatSM2ReviewReason(8, 2.1, 2, true);
    expect(reasonDue).toBe("due for review — last correct 8 days ago, easiness factor 2.1, 2 repetitions");

    const reasonScheduled = formatSM2ReviewReason(2, 2.5, 3, false);
    expect(reasonScheduled).toBe("scheduled for review — last reviewed 2 days ago, easiness factor 2.5");
  });
});
