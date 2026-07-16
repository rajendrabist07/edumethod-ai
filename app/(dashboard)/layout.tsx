import React, { Suspense } from "react";
import { HistorySidebar } from "@/components/HistorySidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950/20 text-[color:var(--text)] transition-colors duration-300">
      {/* Mixed History Sidebar inside Suspense since it reads query searchParams */}
      <Suspense fallback={<div className="w-[280px] h-screen bg-[color:var(--surface)] border-r border-[color:var(--border)]/45 shrink-0" />}>
        <HistorySidebar />
      </Suspense>

      {/* Main content scroll container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center h-screen bg-[color:var(--bg)]">
            <span className="h-6 w-6 rounded-full border-2 border-t-blue-500 border-r-transparent animate-spin"></span>
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
