import type { Metadata } from "next";
import { PersonDetailPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "Edit employee | Peak Process Partners" };

export default async function Page(props: PageProps<"/admin/employees/[id]/edit">) {
  const { id } = await props.params;
  return <PersonDetailPage group="employees" id={id} edit />;
}
