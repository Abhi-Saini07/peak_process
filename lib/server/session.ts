import "server-only";
import { cookies } from "next/headers";
import type { Employee } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { seedHrProvidedDocuments } from "@/lib/server/employeeDocuments";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ppp_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days — onboarding can be resumed later

/**
 * The app has no login: this cookie *is* the session. On first visit
 * (no cookie, or a cookie that doesn't match any row) a new `employees`
 * row is created and its sessionToken — not its primary key — becomes the
 * cookie value, matching the localStorage-era behavior of "just works,
 * no signup step" while keeping the bearer credential distinct from the
 * row's internal id.
 */
/** The browser's current onboarding session token, if any. */
export async function readEmployeeSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/** Name, value and options of the session cookie for an Employee, for a
 *  Route Handler that sets it on its own response (e.g. a redirect). */
export function employeeSessionCookie(sessionToken: string) {
  return {
    name: COOKIE_NAME,
    value: sessionToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    },
  };
}

/** Binds this browser to an Employee: the cookie value is its sessionToken.
 *  Only callable where cookies can be set (Route Handlers, Server Actions). */
export async function setEmployeeSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  const cookie = employeeSessionCookie(sessionToken);
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

export async function getOrCreateEmployee(): Promise<Employee> {
  const existingToken = await readEmployeeSessionToken();

  if (existingToken) {
    const employee = await prisma.employee.findUnique({ where: { sessionToken: existingToken } });
    if (employee) return employee;
  }

  const employee = await prisma.employee.create({ data: {} });
  await seedHrProvidedDocuments(employee.id);
  await setEmployeeSessionCookie(employee.sessionToken);
  return employee;
}
