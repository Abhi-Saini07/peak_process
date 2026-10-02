import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobTitle } from "@/lib/server/jobRepository";
import { requestNow } from "@/lib/server/clock";
import { getApplicationsForJob } from "@/lib/server/applicationRepository";
import { AdminApplicationsViewNocturne } from "@/components/nocturne/recruitment/AdminApplicationsViewNocturne";

export async function generateMetadata(props: PageProps<"/admin/jobs/[id]/applications">): Promise<Metadata> {
  const { id } = await props.params;
  const title = await getJobTitle(id);
  return { title: title ? `Applications — ${title} | Peak Process Partners` : "Applications" };
}

export default async function AdminJobApplicationsPage(props: PageProps<"/admin/jobs/[id]/applications">) {
  const { id } = await props.params;
  const jobTitle = await getJobTitle(id);
  if (!jobTitle) notFound();

  const applications = await getApplicationsForJob(id);
  // One clock for server and client render, so "days in stage" can't mismatch on hydration.
  const now = requestNow();
  return <AdminApplicationsViewNocturne jobTitle={jobTitle} applications={applications} now={now} />;
}
