import { cookies } from "next/headers";
import { Suspense } from "react";
import { DashboardShell } from "@/components/navigation/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const collapsedCookie = cookieStore.get("edutest_sidebar_collapsed")?.value;
  const initialCollapsed = collapsedCookie === "true";

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <DashboardShell initialCollapsed={initialCollapsed}>
        {children}
      </DashboardShell>
    </Suspense>
  );
}
