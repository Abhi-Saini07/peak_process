import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicJobById } from "@/lib/server/jobRepository";
import { JobApplicationFormNocturne } from "@/components/nocturne/recruitment/JobApplicationFormNocturne";

export async function generateMetadata(props: PageProps<"/jobs/[id]/apply">): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  return { title: job ? `Apply — ${job.title} | Peak Process Partners` : "Apply" };
}

export default async function JobApplyPage(props: PageProps<"/jobs/[id]/apply">) {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  return <JobApplicationFormNocturne job={job} />;
}
