import type { Metadata } from "next";
import { PeopleListPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "Employees | Peak Process Partners" };

/** People who have finished and submitted their onboarding. */
export default function AdminEmployeesPage() {
  return <PeopleListPage group="employees" />;
}
