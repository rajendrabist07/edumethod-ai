import { RoleGuard } from "@/app/components/RoleGuard";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { CohortsDashboard } from "./cohorts-dashboard";

export default async function CohortsPage() {
  return (
    <RoleGuard 
      allowedRoles={["teacher", "admin"]} 
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-100px)] text-prism-text">
          <GlassCard className="p-8 text-center max-w-md border border-prism-border/40">
            <span className="text-4xl mb-4 block">🚫</span>
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-prism-muted mt-2">The Cohort view is restricted to Teachers only.</p>
          </GlassCard>
        </div>
      }
    >
      <CohortsDashboard />
    </RoleGuard>
  );
}
