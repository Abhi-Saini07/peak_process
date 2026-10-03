import type { Metadata } from "next";
import { getScheduleState } from "@/lib/server/interviewRepository";
import { ScheduleInterviewNocturne } from "@/components/nocturne/recruitment/ScheduleInterviewNocturne";

export const metadata: Metadata = {
  title: "Schedule your interview | Peak Process Partners",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** The candidate's self-scheduling page: pick, reschedule or cancel from one link. */
export default async function SchedulePage(props: PageProps<"/schedule/[token]">) {
  const { token } = await props.params;
  const state = await getScheduleState(token);
  return <ScheduleInterviewNocturne token={token} state={state} />;
}
