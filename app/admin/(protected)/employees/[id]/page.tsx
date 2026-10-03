import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEmployeeDetail } from "@/lib/server/employeeRepository";
import { AdminEmployeeDetailNocturne } from "@/components/nocturne/recruitment/AdminEmployeesNocturne";

export const metadata: Metadata = { title: "Employee | Peak Process Partners" };

export default async function AdminEmployeeDetailPage(props: PageProps<"/admin/employees/[id]">) {
  const { id } = await props.params;
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();
  return <AdminEmployeeDetailNocturne employee={employee} />;
}
