import { notFound, redirect } from "next/navigation";
import { countPeople, getEmployeeDetail, listPeople } from "@/lib/server/employeeRepository";
import { requestNow } from "@/lib/server/clock";
import { officeTimeZone } from "@/lib/recruitment/timezones";
import { AdminEmployeeDetailNocturne, AdminPeopleListNocturne } from "@/components/nocturne/recruitment/AdminEmployeesNocturne";
import { AdminEmployeeEditNocturne } from "@/components/nocturne/recruitment/AdminEmployeeEditNocturne";
import type { PeopleGroup } from "@/types/employees";

/** Shared by /admin/onboarding and /admin/employees (not a route: no page.tsx here). */
export async function PeopleListPage({ group }: { group: PeopleGroup }) {
  const [people, counts] = await Promise.all([listPeople(group), countPeople()]);
  return <AdminPeopleListNocturne group={group} people={people} counts={counts} now={requestNow()} timeZone={officeTimeZone()} />;
}

/**
 * One person's record, under the list they belong to. A link to the other
 * list (e.g. an old /admin/employees/… link for someone still onboarding,
 * or a new hire who has since submitted) redirects to the right one.
 */
export async function PersonDetailPage({ group, id, edit = false }: { group: PeopleGroup; id: string; edit?: boolean }) {
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();
  const actual: PeopleGroup = employee.status === "submitted" ? "employees" : "onboarding";
  if (actual !== group) redirect(`/admin/${actual}/${id}${edit ? "/edit" : ""}`);
  if (edit) return <AdminEmployeeEditNocturne employee={employee} />;
  return <AdminEmployeeDetailNocturne employee={employee} timeZone={officeTimeZone()} />;
}
