/**
 * Demo recruitment data: 5 published jobs (2 with screening questions) and 30
 * candidates with one application each, spread over every stage. Times are
 * relative to when the seed runs, so the dashboard and board always show a
 * mix: fresh applications, some 7+ and some 14+ days in their stage, flagged
 * screening answers, rejections with reasons, and notes with ratings.
 *
 * Idempotent: every row uses a fixed id (or, for the demo recruiter, a fixed
 * email), and the jobs and candidates are deleted and re-created on each run.
 * ON DELETE CASCADE removes their applications, history, notes and documents.
 * Nothing outside these ids is touched. Resume documents are metadata only:
 * no file exists in storage for them, so downloading one returns an error.
 */
import type { PrismaClient, RejectReason } from "@prisma/client";
import { computeKnockoutFlag, snapshotKnockoutAnswers, type KnockoutQuestion } from "../lib/recruitment/knockouts";
import { PRIVACY_CONSENT_VERSION } from "../lib/recruitment/consent";
import type { ApplicationStatus } from "../lib/recruitment/constants";

const DAY = 24 * 60 * 60 * 1000;

/** Fixed, valid v4-shaped UUIDs: 5eed000<kind>-0000-4000-8000-<n>. */
function seedId(kind: number, n: number): string {
  return `5eed000${kind}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const FORWARD: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview", "selected"];

const RECRUITER_EMAIL = "seed.recruiter@example.com";

type SeedJob = {
  n: number;
  title: string;
  department: string;
  location: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  workMode: "onsite" | "hybrid" | "remote";
  publishedDaysAgo: number;
  deadlineInDays: number | null;
  salary: [number, number] | null;
  salaryPublic: boolean;
  knockouts: KnockoutQuestion[];
  overview: string;
};

const JOBS: SeedJob[] = [
  {
    n: 1,
    title: "Senior Accountant",
    department: "Finance",
    location: "Pune",
    employmentType: "full_time",
    workMode: "hybrid",
    publishedDaysAgo: 28,
    deadlineInDays: 30,
    salary: [900000, 1400000],
    salaryPublic: true,
    knockouts: [
      { id: "kq-sa-1", label: "Are you a qualified CA or CMA?", qualifyingAnswer: true },
      { id: "kq-sa-2", label: "Can you work from our Pune office three days a week?", qualifyingAnswer: true },
    ],
    overview: "Own month-end close, GST filings and audit support for a growing client portfolio.",
  },
  {
    n: 2,
    title: "Payroll Specialist",
    department: "People Operations",
    location: "Bengaluru",
    employmentType: "full_time",
    workMode: "onsite",
    publishedDaysAgo: 21,
    deadlineInDays: 5,
    salary: [600000, 850000],
    salaryPublic: false,
    knockouts: [{ id: "kq-ps-1", label: "Do you need visa sponsorship to work in India?", qualifyingAnswer: false }],
    overview: "Run monthly payroll for 1,200 employees across three states, end to end.",
  },
  {
    n: 3,
    title: "Tax Associate",
    department: "Tax",
    location: "Mumbai",
    employmentType: "full_time",
    workMode: "remote",
    publishedDaysAgo: 12,
    deadlineInDays: null,
    salary: [500000, 750000],
    salaryPublic: true,
    knockouts: [],
    overview: "Prepare direct and indirect tax returns and help clients answer notices.",
  },
  {
    n: 4,
    title: "HR Generalist",
    department: "People Operations",
    location: "Pune",
    employmentType: "contract",
    workMode: "hybrid",
    publishedDaysAgo: 9,
    deadlineInDays: 40,
    salary: null,
    salaryPublic: false,
    knockouts: [],
    overview: "Support hiring, onboarding and employee queries for our Pune team.",
  },
  {
    n: 5,
    title: "Operations Analyst Intern",
    department: "Operations",
    location: "Bengaluru",
    employmentType: "internship",
    workMode: "onsite",
    publishedDaysAgo: 45,
    deadlineInDays: 60,
    salary: null,
    salaryPublic: false,
    knockouts: [],
    overview: "Six-month internship building reports and improving client service processes.",
  },
];

const FIRST = ["Priya", "Rahul", "Ananya", "Vikram", "Meera", "Arjun", "Kavya", "Rohan", "Isha", "Dev",
  "Sneha", "Aditya", "Pooja", "Karan", "Nisha", "Siddharth", "Tanvi", "Varun", "Aisha", "Manish",
  "Riya", "Nikhil", "Divya", "Harsh", "Shreya", "Amit", "Neha", "Yash", "Lakshmi", "Farhan"];
const LAST = ["Sharma", "Verma", "Iyer", "Singh", "Nair", "Rao", "Menon", "Das", "Kapoor", "Patel",
  "Kulkarni", "Joshi", "Reddy", "Mehta", "Bose", "Chopra", "Desai", "Gupta", "Khan", "Pillai"];
const CITIES = ["Pune", "Bengaluru", "Mumbai", "Hyderabad", "Chennai", "Delhi"];
const EDUCATION = ["bachelors", "masters", "diploma", "bachelors", "doctorate"];

/**
 * One row per application: job, current stage, days since applying, days in
 * the current stage. Ages are chosen so every dashboard widget has content
 * (Operations Analyst Intern has had no applicant for 20+ days on purpose).
 */
type Plan = { job: number; status: ApplicationStatus; appliedDaysAgo: number; inStageDays: number; reject?: [RejectReason, string?] };
const PLAN: Plan[] = [
  // Applied: mostly fresh, two waiting a while
  { job: 1, status: "applied", appliedDaysAgo: 0.2, inStageDays: 0.2 },
  { job: 1, status: "applied", appliedDaysAgo: 1, inStageDays: 1 },
  { job: 2, status: "applied", appliedDaysAgo: 2, inStageDays: 2 },
  { job: 3, status: "applied", appliedDaysAgo: 3, inStageDays: 3 },
  { job: 4, status: "applied", appliedDaysAgo: 4, inStageDays: 4 },
  { job: 2, status: "applied", appliedDaysAgo: 6, inStageDays: 6 },
  { job: 1, status: "applied", appliedDaysAgo: 9, inStageDays: 9 },
  { job: 3, status: "applied", appliedDaysAgo: 11, inStageDays: 11 },
  // Under review
  { job: 1, status: "under_review", appliedDaysAgo: 8, inStageDays: 3 },
  { job: 2, status: "under_review", appliedDaysAgo: 12, inStageDays: 8 },
  { job: 3, status: "under_review", appliedDaysAgo: 10, inStageDays: 5 },
  { job: 4, status: "under_review", appliedDaysAgo: 8, inStageDays: 6 },
  { job: 1, status: "under_review", appliedDaysAgo: 22, inStageDays: 16 },
  { job: 5, status: "under_review", appliedDaysAgo: 30, inStageDays: 21 },
  // Shortlisted
  { job: 1, status: "shortlisted", appliedDaysAgo: 18, inStageDays: 12 },
  { job: 2, status: "shortlisted", appliedDaysAgo: 15, inStageDays: 4 },
  { job: 3, status: "shortlisted", appliedDaysAgo: 11, inStageDays: 2 },
  { job: 4, status: "shortlisted", appliedDaysAgo: 9, inStageDays: 7 },
  { job: 5, status: "shortlisted", appliedDaysAgo: 40, inStageDays: 25 },
  // Interview
  { job: 1, status: "interview", appliedDaysAgo: 25, inStageDays: 5 },
  { job: 2, status: "interview", appliedDaysAgo: 19, inStageDays: 15 },
  { job: 3, status: "interview", appliedDaysAgo: 12, inStageDays: 1 },
  { job: 5, status: "interview", appliedDaysAgo: 35, inStageDays: 9 },
  // Selected (one this month, one earlier)
  { job: 1, status: "selected", appliedDaysAgo: 27, inStageDays: 1 },
  { job: 5, status: "selected", appliedDaysAgo: 44, inStageDays: 35 },
  // Rejected, with reasons
  { job: 1, status: "rejected", appliedDaysAgo: 20, inStageDays: 14, reject: ["failed_knockout"] },
  { job: 2, status: "rejected", appliedDaysAgo: 16, inStageDays: 10, reject: ["compensation"] },
  { job: 3, status: "rejected", appliedDaysAgo: 9, inStageDays: 3, reject: ["skills_experience"] },
  { job: 4, status: "rejected", appliedDaysAgo: 8, inStageDays: 2, reject: ["other", "Asked to be considered for the Mumbai office instead."] },
  { job: 5, status: "rejected", appliedDaysAgo: 38, inStageDays: 30, reject: ["withdrew"] },
];

/** Which applicants on knockout jobs answer "wrong" (flagged). */
const WRONG_ANSWER = new Set([1, 6, 9, 14, 20, 25, 26]);

const NOTES: { app: number; body: string; rating: number | null; daysAgo: number }[] = [
  { app: 9, body: "Solid Tally and GST experience. Happy to move forward.", rating: 4, daysAgo: 2.5 },
  { app: 13, body: "Strong CV but slow to reply to our scheduling emails.", rating: 3, daysAgo: 10 },
  { app: 15, body: "Excellent phone screen. Led two statutory audits last year.", rating: 5, daysAgo: 11 },
  { app: 15, body: "Second opinion: agree, strong candidate.", rating: 4, daysAgo: 9 },
  { app: 16, body: "Good payroll background; salary expectation is at the top of our band.", rating: 3, daysAgo: 3 },
  { app: 18, body: "Asked about remote work twice. Check before the interview.", rating: null, daysAgo: 5 },
  { app: 20, body: "First interview went well. Needs a case study round.", rating: 4, daysAgo: 4 },
  { app: 21, body: "Interview pending on their side for two weeks now.", rating: 2, daysAgo: 6 },
  { app: 24, body: "Offer accepted. Joining on the 1st.", rating: 5, daysAgo: 0.5 },
  { app: 26, body: "Not a CA yet; suggest the Tax Associate role instead.", rating: 2, daysAgo: 13 },
  { app: 27, body: "Expected 40% above the band.", rating: 3, daysAgo: 9 },
  { app: 2, body: "Looks promising, will review tomorrow.", rating: null, daysAgo: 0.6 },
];

export async function seedRecruitment(prisma: PrismaClient): Promise<string> {
  const now = Date.now();
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY);
  const dateOnly = (daysFromNow: number) => {
    const d = new Date(now + daysFromNow * DAY);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };

  const jobIds = JOBS.map((j) => seedId(1, j.n));
  const candidateIds = PLAN.map((_, i) => seedId(2, i + 1));

  const recruiter = await prisma.adminUser.upsert({
    where: { email: RECRUITER_EMAIL },
    update: {},
    create: { email: RECRUITER_EMAIL, fullName: "Seed Recruiter" },
  });

  // Children cascade from both sides.
  await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  await prisma.candidate.deleteMany({ where: { id: { in: candidateIds } } });

  for (const job of JOBS) {
    await prisma.job.create({
      data: {
        id: seedId(1, job.n),
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        workMode: job.workMode,
        experienceMinYears: job.employmentType === "internship" ? 0 : 2,
        experienceMaxYears: job.employmentType === "internship" ? 1 : 8,
        salaryMin: job.salary?.[0] ?? null,
        salaryMax: job.salary?.[1] ?? null,
        salaryPublic: job.salaryPublic,
        overview: job.overview,
        responsibilities: "Work with clients and the wider team\nKeep records accurate and on time\nSuggest process improvements",
        requirements: "Relevant degree or equivalent experience\nClear written and spoken English\nComfort with spreadsheets",
        requiredSkills: ["Excel", "Communication"],
        preferredSkills: ["Tally"],
        benefits: "Health insurance\nLearning budget\nFlexible hours",
        deadline: job.deadlineInDays == null ? null : dateOnly(job.deadlineInDays),
        status: "published",
        knockouts: job.knockouts.length > 0 ? job.knockouts : undefined,
        createdBy: recruiter.id,
        createdAt: at(job.publishedDaysAgo + 1),
        publishedAt: at(job.publishedDaysAgo),
      },
    });
  }

  for (const [i, plan] of PLAN.entries()) {
    const n = i + 1;
    const firstName = FIRST[i % FIRST.length];
    const lastName = LAST[(i * 7) % LAST.length];
    const job = JOBS.find((j) => j.n === plan.job)!;
    const applicationId = seedId(3, n);
    const appliedAt = at(plan.appliedDaysAgo);
    const stageEnteredAt = at(plan.inStageDays);

    const answers = Object.fromEntries(
      job.knockouts.map((q) => [q.id, WRONG_ANSWER.has(n) && q === job.knockouts[0] ? !q.qualifyingAnswer : q.qualifyingAnswer]),
    );

    // History: applied, then one step at a time to the current stage (or to
    // rejected), spaced evenly between applying and entering the stage.
    const target = plan.status === "rejected" ? "rejected" : plan.status;
    const forwardTo = plan.status === "rejected" ? Math.min(2, Math.floor(plan.appliedDaysAgo / 7)) : FORWARD.indexOf(plan.status);
    const path: ApplicationStatus[] = FORWARD.slice(0, forwardTo + 1);
    if (target === "rejected") path.push("rejected");
    const steps = path.length - 1;
    const history = path.map((status, step) => ({
      id: seedId(4, n * 10 + step),
      oldStatus: step === 0 ? null : path[step - 1],
      newStatus: status,
      changedByAdminId: step === 0 ? null : recruiter.id,
      changedAt:
        step === 0
          ? appliedAt
          : step === steps
            ? stageEnteredAt
            : new Date(appliedAt.getTime() + ((stageEnteredAt.getTime() - appliedAt.getTime()) * step) / steps),
      rejectReason: status === "rejected" ? plan.reject?.[0] ?? null : null,
      rejectNote: status === "rejected" ? plan.reject?.[1] ?? null : null,
    }));

    await prisma.candidate.create({
      data: {
        id: seedId(2, n),
        firstName,
        lastName,
        email: `${firstName}.${lastName}.${n}@example.com`.toLowerCase(),
        phone: `98${String(76543210 + n * 1301).slice(0, 8)}`,
        location: CITIES[i % CITIES.length],
        experienceYears: 1 + ((i * 3) % 9),
        education: EDUCATION[i % EDUCATION.length],
        linkedinUrl: i % 3 === 0 ? `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${n}` : null,
        createdAt: appliedAt,
        applications: {
          create: {
            id: applicationId,
            jobId: seedId(1, job.n),
            status: plan.status,
            appliedAt,
            stageEnteredAt,
            coverLetter: i % 4 === 0 ? "I'd love to bring my experience to your team." : null,
            rejectReason: plan.reject?.[0] ?? null,
            rejectNote: plan.reject?.[1] ?? null,
            knockoutAnswers: job.knockouts.length > 0 ? snapshotKnockoutAnswers(job.knockouts, answers) : undefined,
            knockoutFlagged: computeKnockoutFlag(job.knockouts, answers),
            consentedAt: appliedAt,
            consentVersion: PRIVACY_CONSENT_VERSION,
            statusHistory: { create: history.map(({ id, ...rest }) => ({ id, ...rest })) },
            documents: {
              create: {
                id: seedId(5, n),
                documentType: "resume",
                fileName: `${firstName}_${lastName}_CV.pdf`,
                fileSize: 80_000 + n * 2_345,
                mimeType: "application/pdf",
                // Metadata only: no object exists at this path.
                storagePath: `seed/${applicationId}/resume.pdf`,
                uploadedAt: appliedAt,
              },
            },
          },
        },
      },
    });
  }

  await prisma.applicationNote.createMany({
    data: NOTES.map((note, i) => ({
      id: seedId(6, i + 1),
      applicationId: seedId(3, note.app),
      authorAdminId: recruiter.id,
      body: note.body,
      rating: note.rating,
      createdAt: at(note.daysAgo),
    })),
  });

  const flagged = PLAN.filter((_, i) => {
    const job = JOBS.find((j) => j.n === PLAN[i].job)!;
    return job.knockouts.length > 0 && WRONG_ANSWER.has(i + 1);
  }).length;
  return `Seeded ${JOBS.length} published jobs, ${PLAN.length} candidates/applications (${flagged} flagged), ${NOTES.length} notes.`;
}
