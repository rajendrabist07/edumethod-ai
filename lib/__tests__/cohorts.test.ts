import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../../app/api/cohorts/route";
import { POST as JOIN_POST } from "../../app/api/cohorts/join/route";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";

// 1. Mock Clerk Authentication
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn().mockImplementation(() => Promise.resolve({
    users: {
      getUserList: vi.fn().mockResolvedValue([]),
    }
  })),
}));

// 2. Mock Supabase Admin Client
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("Cohorts API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cohorts", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      
      const req = new Request("http://localhost/api/cohorts");
      const res = await GET(req as any);
      
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should fetch and return joined cohorts successfully for students", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user_student" } as any);
      
      // Mock user role fetch: student
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: "student" }, error: null });
      const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

      // Mock cohort members lookup
      const mockEqMembers = vi.fn().mockResolvedValue({
        data: [
          {
            cohorts: {
              id: "cohort-joined",
              name: "Biology 101",
              created_at: "2026-08-01T00:00:00Z",
              teacher_id: "teacher-1"
            }
          }
        ],
        error: null
      });
      const mockSelectMembers = vi.fn().mockReturnValue({ eq: mockEqMembers });

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return { select: mockSelectProfile } as any;
        }
        return { select: mockSelectMembers } as any;
      });

      const req = new Request("http://localhost/api/cohorts");
      const res = await GET(req as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cohorts).toHaveLength(1);
      expect(body.cohorts[0].name).toBe("Biology 101");
    });

    it("should fetch and return cohorts successfully for teachers", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user_teacher" } as any);
      
      // Mock role lookup: teacher
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: "teacher" }, error: null });
      const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

      // Mock cohorts lookup
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: "cohort-123",
            name: "Physics 101",
            created_at: "2026-08-01T00:00:00Z",
            cohort_members: [{ student_id: "student-1" }]
          }
        ],
        error: null
      });
      const mockEqCohorts = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelectCohorts = vi.fn().mockReturnValue({ eq: mockEqCohorts });

      // Build chain mock
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return { select: mockSelectProfile } as any;
        }
        return { select: mockSelectCohorts } as any;
      });

      const req = new Request("http://localhost/api/cohorts");
      const res = await GET(req as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cohorts).toHaveLength(1);
      expect(body.cohorts[0].name).toBe("Physics 101");
      expect(body.cohorts[0].memberCount).toBe(1);
    });
  });

  describe("POST /api/cohorts/join", () => {
    it("should reject join request if Cohort ID is not a valid UUID", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user_student" } as any);

      const req = new Request("http://localhost/api/cohorts/join", {
        method: "POST",
        body: JSON.stringify({ cohortId: "invalid-uuid" }),
      });

      const res = await JOIN_POST(req as any);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("format");
    });
  });
});
