import type { MetadataRoute } from "next";
import { getSitemapJobs } from "@/lib/server/jobRepository";
import { absoluteUrl } from "@/lib/site";

/** The careers list plus every published, unexpired job. Rendered per request
 *  so new and closed jobs show up straight away. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getSitemapJobs();
  const newest = jobs.reduce<Date | undefined>((max, j) => (!max || j.updatedAt > max ? j.updatedAt : max), undefined);
  return [
    { url: absoluteUrl("/jobs"), lastModified: newest, changeFrequency: "daily", priority: 1 },
    ...jobs.map((job) => ({
      url: absoluteUrl(`/jobs/${job.id}`),
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
