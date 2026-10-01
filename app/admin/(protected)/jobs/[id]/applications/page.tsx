import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobTitle } from "@/lib/server/jobRepository";
import { getApplicationsForJob } from "@/lib/server/applicationRepository";
import { AdminApplicationsListNocturne } from "@/components/nocturne/recruitment/AdminApplicationsListNocturne";

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
  return <AdminApplicationsListNocturne jobTitle={jobTitle} applications={applications} />;
}
