import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { LayoutProvider } from "@/components/layout/LayoutContext";
import { AppLayout } from "@/components/layout/AppLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <LayoutProvider initialCollapsed={collapsed}>
      <AppLayout>
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center h-screen bg-[color:var(--bg)]">
            <span className="h-6 w-6 rounded-full border-2 border-t-blue-500 border-r-transparent animate-spin"></span>
          </div>
        }>
          {children}
        </Suspense>
      </AppLayout>
    </LayoutProvider>
  );
}
