import type { EmploymentType } from "./constants";

/**
 * schema.org JobPosting JSON-LD for a public job page (Google for Jobs).
 * Pure: the page passes in the job and the site URL.
 */

const EMPLOYMENT_TYPE: Record<EmploymentType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

export type JobPostingInput = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  workMode: "onsite" | "hybrid" | "remote";
  overview: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  /** ISO timestamp */
  publishedAt: string | null;
  /** yyyy-mm-dd */
  deadline: string | null;
  /** Only set when the job's salary is public. */
  salaryMin: number | null;
  salaryMax: number | null;
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function lines(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

/** The job's sections as simple HTML, which Google's JobPosting description accepts. */
export function jobDescriptionHtml(job: Pick<JobPostingInput, "title" | "overview" | "responsibilities" | "requirements" | "benefits">): string {
  const parts: string[] = [];
  for (const p of lines(job.overview)) parts.push(`<p>${escapeHtml(p)}</p>`);
  const list = (heading: string, text: string | null) => {
    const items = lines(text);
    if (items.length === 0) return;
    parts.push(`<p><strong>${heading}</strong></p><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`);
  };
  list("Responsibilities", job.responsibilities);
  list("Requirements", job.requirements);
  list("Benefits", job.benefits);
  return parts.join("") || `<p>${escapeHtml(job.title)}</p>`;
}

export function buildJobPostingJsonLd(job: JobPostingInput, opts: { siteUrl: string; organizationName: string }) {
  const place = job.location
    ? {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" },
      }
    : undefined;
  const hasSalary = job.salaryMin != null || job.salaryMax != null;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescriptionHtml(job),
    identifier: { "@type": "PropertyValue", name: opts.organizationName, value: job.id },
    datePosted: job.publishedAt ?? undefined,
    // A yyyy-mm-dd deadline means "through the end of that day".
    validThrough: job.deadline ? `${job.deadline}T23:59:59` : undefined,
    employmentType: EMPLOYMENT_TYPE[job.employmentType],
    hiringOrganization: { "@type": "Organization", name: opts.organizationName, sameAs: opts.siteUrl },
    jobLocation: place,
    ...(job.workMode === "remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "India" } }
      : {}),
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salaryMin != null ? { minValue: job.salaryMin } : {}),
              ...(job.salaryMax != null ? { maxValue: job.salaryMax } : {}),
              unitText: "YEAR",
            },
          },
        }
      : {}),
    industry: job.department ?? undefined,
    directApply: true,
    url: `${opts.siteUrl}/jobs/${job.id}`,
  };
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so job text can never close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
