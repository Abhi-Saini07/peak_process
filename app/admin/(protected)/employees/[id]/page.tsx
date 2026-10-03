import type { Metadata } from "next";
import { PersonDetailPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "Employee | Peak Process Partners" };

export default async function AdminEmployeeDetailPage(props: PageProps<"/admin/employees/[id]">) {
  const { id } = await props.params;
  return <PersonDetailPage group="employees" id={id} />;
}
