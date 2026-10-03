import type { Metadata } from "next";
import { requestNow } from "@/lib/server/clock";
import { getPendingScheduleInvites, getUpcomingInterviews, listInterviewers } from "@/lib/server/interviewRepository";
import { officeTimeZone } from "@/lib/recruitment/timezones";
import { AdminInterviewsNocturne } from "@/components/nocturne/recruitment/AdminInterviewsNocturne";

export const metadata: Metadata = { title: "Interviews | Peak Process Partners" };

export default async function AdminInterviewsPage() {
  const now = requestNow();
  const [interviews, invites, interviewers] = await Promise.all([
    getUpcomingInterviews(new Date(now)),
    getPendingScheduleInvites(new Date(now)),
    listInterviewers(),
  ]);
  return (
    <AdminInterviewsNocturne interviews={interviews} invites={invites} interviewers={interviewers} timeZone={officeTimeZone()} now={now} />
  );
}
