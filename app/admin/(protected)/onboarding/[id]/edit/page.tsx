import type { Metadata } from "next";
import { PersonDetailPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "Edit new hire | Peak Process Partners" };

export default async function Page(props: PageProps<"/admin/onboarding/[id]/edit">) {
  const { id } = await props.params;
  return <PersonDetailPage group="onboarding" id={id} edit />;
}
