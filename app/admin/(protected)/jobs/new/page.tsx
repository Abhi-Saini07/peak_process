import type { Metadata } from "next";
import { AdminJobFormNocturne } from "@/components/nocturne/recruitment/AdminJobFormNocturne";

export const metadata: Metadata = { title: "Create Job | Peak Process Partners" };

export default function NewJobPage() {
  return <AdminJobFormNocturne mode="create" />;
}
