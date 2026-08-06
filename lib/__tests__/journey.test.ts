import { describe, it, expect } from "vitest";
import { calculateStreak } from "../journey";

describe("Structured Learning Journey Engine", () => {
  describe("Streak Calculation Algorithm", () => {
    it("should return 0 for empty activity history", () => {
      expect(calculateStreak([])).toBe(0);
    });

    it("should return 1 for activity today", () => {
      const today = new Date().toISOString();
      expect(calculateStreak([today])).toBe(1);
    });

    it("should return 1 for activity yesterday when today has no activity yet", () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      expect(calculateStreak([yesterday.toISOString()])).toBe(1);
    });

    it("should calculate consecutive streak across multiple days", () => {
      const today = new Date();
      const d1 = today.toISOString();

      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const d2 = yesterday.toISOString();

      const twoDaysAgo = new Date();
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
      const d3 = twoDaysAgo.toISOString();

      expect(calculateStreak([d1, d2, d3])).toBe(3);
    });

    it("should reset streak to 0 if gap exceeds 1 day", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
      expect(calculateStreak([threeDaysAgo.toISOString()])).toBe(0);
    });
  });
});
