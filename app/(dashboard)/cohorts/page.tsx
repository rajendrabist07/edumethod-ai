import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RoleGuard } from "@/app/components/RoleGuard";
import { GlassCard } from "@/app/components/ui/GlassCard";

export default async function CohortsPage() {
  const { userId } = await auth();
  
  // Fetch teacher's cohorts and member count
  let cohorts: any[] = [];
  if (userId) {
    const { data } = await supabaseAdmin
      .from("cohorts")
      .select("id, name, created_at, cohort_members(count)")
      .eq("teacher_id", userId);
    if (data) cohorts = data;
  }

  return (
    <RoleGuard 
      allowedRoles={["teacher", "admin"]} 
      fallback={
        <div className="flex items-center justify-center h-full text-prism-text">
          <GlassCard className="p-8 text-center max-w-md">
            <span className="text-4xl mb-4 block">🚫</span>
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-prism-muted mt-2">The Cohort view is restricted to Teachers only.</p>
          </GlassCard>
        </div>
      }
    >
      <main className="p-6 text-prism-text">
        <div className="flex justify-between items-end mb-8 border-b border-prism-border pb-4">
          <div>
            <h1 className="text-3xl font-display font-black">Cohort Overview</h1>
            <p className="text-sm text-prism-muted mt-1">Manage your classrooms and track aggregate student mastery.</p>
          </div>
          <button className="px-4 py-2 bg-prism-accent text-white font-bold rounded-lg hover:bg-opacity-90 transition-all text-sm">
            + New Cohort
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-prism-muted">
              You haven't created any cohorts yet.
            </div>
          ) : (
            cohorts.map((c) => (
              <GlassCard key={c.id} className="p-6 border border-prism-border hover:border-prism-accent/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <span className="bg-prism-surface/80 px-2 py-1 rounded text-xs text-prism-muted">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-prism-muted">
                    <span className="text-prism-text font-bold text-xl">{c.cohort_members[0].count}</span> students
                  </div>
                  <div className="text-right">
                    <div className="text-prism-accent font-bold">78% Avg</div>
                    <div className="text-xs text-prism-muted">Mastery Score</div>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </main>
    </RoleGuard>
  );
}
