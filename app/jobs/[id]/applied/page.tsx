import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobTitle } from "@/lib/server/jobRepository";
import { ApplicationConfirmationNocturne } from "@/components/nocturne/recruitment/ApplicationConfirmationNocturne";

export const metadata: Metadata = { title: "Application Received | Peak Process Partners" };

export default async function JobAppliedPage(props: PageProps<"/jobs/[id]/applied">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const jobTitle = await getJobTitle(id);
  if (!jobTitle) notFound();

  const refParam = searchParams.ref;
  const reference = typeof refParam === "string" ? refParam : "";

  return <ApplicationConfirmationNocturne jobTitle={jobTitle} reference={reference} />;
}
