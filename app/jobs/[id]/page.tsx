import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicJobById } from "@/lib/server/jobRepository";
import { buildJobPostingJsonLd, serializeJsonLd } from "@/lib/recruitment/jobPosting";
import { employmentTypeLabel, workModeLabel } from "@/lib/recruitment/constants";
import { ORGANIZATION_NAME, absoluteUrl, siteUrl } from "@/lib/site";
import { PublicJobDetailNocturne } from "@/components/nocturne/recruitment/PublicJobDetailNocturne";
import type { PublicJobDetail } from "@/types/recruitment";

function metaDescription(job: PublicJobDetail): string {
  const facts = [job.location, workModeLabel(job.workMode), employmentTypeLabel(job.employmentType)].filter(Boolean).join(" · ");
  const lead = job.overviewExcerpt ?? `Join ${ORGANIZATION_NAME}${job.department ? ` in ${job.department}` : ""}.`;
  const text = `${lead} ${facts}.`;
  return text.length > 300 ? `${text.slice(0, 297).trimEnd()}…` : text;
}

export async function generateMetadata(props: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  if (!job) return { title: "Position not found", robots: { index: false } };

  const title = `${job.title} | ${ORGANIZATION_NAME}`;
  const description = metaDescription(job);
  const url = absoluteUrl(`/jobs/${job.id}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: `${ORGANIZATION_NAME} Careers` },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Closed, draft and expired jobs aren't returned by getPublicJobById, so they 404. */
export default async function PublicJobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  const jsonLd = buildJobPostingJsonLd(job, { siteUrl: siteUrl(), organizationName: ORGANIZATION_NAME });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PublicJobDetailNocturne job={job} />
    </>
  );
}
