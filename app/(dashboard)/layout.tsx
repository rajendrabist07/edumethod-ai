import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { LayoutProvider } from "@/components/layout/LayoutContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth();
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!user.publicMetadata?.onboarded) {
      redirect("/onboarding");
    }
  }

  const cookieStore = await cookies();
  const collapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <LayoutProvider initialCollapsed={collapsed}>
      <AppLayout>
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center h-screen bg-prism-base">
            <span className="h-6 w-6 rounded-full border-2 border-t-blue-500 border-r-transparent animate-spin"></span>
          </div>
        }>
          {children}
        </Suspense>
      </AppLayout>
    </LayoutProvider>
  );
}
