import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

/**
 * Admin Layout Server Guard (Defense-in-Depth)
 *
 * Verifies that the active caller has a confirmed administrative role (via database SSOT or server env)
 * before rendering any child server components or pages inside /admin/**.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const userIsAdmin = await isAdmin(supabase, user);

  if (!userIsAdmin) {
    redirect("/dashboard?unauthorized=admin_required");
  }

  return <>{children}</>;
}
