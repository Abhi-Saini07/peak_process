import type { Metadata } from "next";
import { listEmployees } from "@/lib/server/employeeRepository";
import { AdminEmployeesListNocturne } from "@/components/nocturne/recruitment/AdminEmployeesNocturne";

export const metadata: Metadata = { title: "Employees | Peak Process Partners" };

export default async function AdminEmployeesPage() {
  return <AdminEmployeesListNocturne employees={await listEmployees()} />;
}
