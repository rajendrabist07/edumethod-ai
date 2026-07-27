"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GlassCard } from "@/app/components/ui/GlassCard";

// Disable SSR for react-force-graph-2d since it relies on window/canvas
const ForceGraph = dynamic(() => import("@/app/components/dashboard/ForceGraphClient"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-prism-surface/50 w-full h-full rounded-2xl"></div>
});

export default function MasteryMapPage() {
  const [data, setData] = useState<{ nodes: any[]; links: any[] } | null>(null);

  useEffect(() => {
    fetch("/api/mastery-map")
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <main className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-black">Knowledge Graph</h1>
        <p className="text-sm text-prism-muted mt-1">Visualize your prerequisite chains and mastery scoring.</p>
      </div>

      {!data ? (
        <div className="flex-grow flex items-center justify-center">
          <span className="h-6 w-6 rounded-full border-2 border-t-prism-accent border-r-transparent animate-spin"></span>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Graph View */}
          <div className="hidden md:block flex-grow relative rounded-3xl overflow-hidden glass-prism border border-prism-border">
            {data.nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-prism-muted">
                No syllabus paths mapped yet. Create one to see your graph!
              </div>
            ) : (
              <ForceGraph data={data} />
            )}
            
            {/* Legend */}
            <div className="absolute bottom-6 left-6 glass-prism p-3 rounded-xl border border-prism-border flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Needs Review</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Familiar</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Mastered</div>
            </div>
          </div>

          {/* Mobile List View (force-graph is bad on small screens) */}
          <div className="md:hidden flex-grow overflow-y-auto space-y-4">
            {data.nodes.length === 0 ? (
              <div className="text-center text-prism-muted mt-10">
                No topics mapped yet.
              </div>
            ) : (
              data.nodes.map((node) => (
                <GlassCard key={node.id} className="p-4 flex items-center justify-between border border-prism-border">
                  <span className="font-semibold">{node.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-md bg-opacity-20 ${
                    node.val < 50 ? "bg-red-500 text-red-300" :
                    node.val < 80 ? "bg-yellow-500 text-yellow-300" :
                    "bg-green-500 text-green-300"
                  }`}>
                    {Math.round(node.val)}% Mastery
                  </span>
                </GlassCard>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
