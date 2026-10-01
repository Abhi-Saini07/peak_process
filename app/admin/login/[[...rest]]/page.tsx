import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginNocturne } from "@/components/nocturne/recruitment/AdminLoginNocturne";
import { AdminNoAccess } from "@/components/recruitment/AdminNoAccess";
import { resolveAdminAccess } from "@/lib/server/adminSession";

export const metadata: Metadata = { title: "Admin Sign In | Peak Process Partners" };

// Catch-all so Clerk's multi-step sign-in (/admin/login/factor-one, …) stays on this page.
export default async function AdminLoginPage() {
  const access = await resolveAdminAccess();
  if (access.status === "ok") redirect("/admin/jobs");
  if (access.status === "forbidden") return <AdminNoAccess email={access.email} />;
  return <AdminLoginNocturne />;
}
