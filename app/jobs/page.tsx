import type { Metadata } from "next";
import { getPublicJobs } from "@/lib/server/jobRepository";
import { PublicJobsListNocturne } from "@/components/nocturne/recruitment/PublicJobsListNocturne";

export const metadata: Metadata = {
  title: "Careers | Peak Process Partners",
  description: "Open positions at Peak Process Partners.",
};

// This has no dynamic segment and reads no cookies/headers, so Next would
// otherwise try to statically prerender it — running the Prisma query at
// BUILD time instead of per-request. That's wrong for a live listing (stale
// until next deploy, could show a job after it's closed) and is exactly
// what broke the Vercel build (no DATABASE_URL available at build time).
export const dynamic = "force-dynamic";

export default async function PublicJobsPage() {
  const jobs = await getPublicJobs();
  return <PublicJobsListNocturne jobs={jobs} />;
}
