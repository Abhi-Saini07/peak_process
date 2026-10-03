import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApplicationById } from "@/lib/server/applicationRepository";
import { requestNow } from "@/lib/server/clock";
import { getCurrentAdmin } from "@/lib/server/adminSession";
import { getApplicationInterviews, listInterviewers } from "@/lib/server/interviewRepository";
import { officeTimeZone } from "@/lib/recruitment/timezones";
import { AdminApplicationDetailNocturne } from "@/components/nocturne/recruitment/AdminApplicationDetailNocturne";

export async function generateMetadata(props: PageProps<"/admin/applications/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const application = await getApplicationById(id);
  return { title: application ? `${application.candidateName} | Peak Process Partners` : "Application" };
}

export default async function AdminApplicationDetailPage(props: PageProps<"/admin/applications/[id]">) {
  const { id } = await props.params;
  const application = await getApplicationById(id);
  if (!application) notFound();
  const [admin, { interviews, invites }, interviewers] = await Promise.all([
    getCurrentAdmin(),
    getApplicationInterviews(id),
    listInterviewers(),
  ]);

  return (
    <AdminApplicationDetailNocturne
      application={application}
      now={requestNow()}
      scheduling={{ interviews, invites, interviewers, currentAdminId: admin?.id ?? "", timeZone: officeTimeZone() }}
    />
  );
}
