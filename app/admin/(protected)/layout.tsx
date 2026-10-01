import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/adminSession";
import { AdminShellNocturne } from "@/components/nocturne/recruitment/AdminShellNocturne";
import { AppFrame } from "@/components/navigation/AppFrame";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <AppFrame>
      <AdminShellNocturne adminName={admin.fullName}>{children}</AdminShellNocturne>
    </AppFrame>
  );
}
