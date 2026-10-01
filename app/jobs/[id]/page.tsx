import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicJobById } from "@/lib/server/jobRepository";
import { PublicJobDetailNocturne } from "@/components/nocturne/recruitment/PublicJobDetailNocturne";

export async function generateMetadata(props: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  return { title: job ? `${job.title} | Peak Process Partners` : "Position not found" };
}

export default async function PublicJobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  return <PublicJobDetailNocturne job={job} />;
}
