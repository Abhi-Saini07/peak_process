import type { Metadata } from "next";
import { PersonDetailPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "New hire | Peak Process Partners" };

export default async function AdminNewHireDetailPage(props: PageProps<"/admin/onboarding/[id]">) {
  const { id } = await props.params;
  return <PersonDetailPage group="onboarding" id={id} />;
}
