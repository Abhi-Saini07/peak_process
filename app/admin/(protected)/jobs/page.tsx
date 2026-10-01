import type { Metadata } from "next";
import { getAdminJobs } from "@/lib/server/jobRepository";
import { AdminJobsListNocturne } from "@/components/nocturne/recruitment/AdminJobsListNocturne";

export const metadata: Metadata = { title: "Job Openings | Peak Process Partners" };

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();
  return <AdminJobsListNocturne jobs={jobs} />;
}
