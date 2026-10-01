import { NextResponse } from "next/server";
import { getOrCreateEmployee } from "@/lib/server/session";
import { resetOnboarding } from "@/lib/server/onboardingRepository";

export const runtime = "nodejs";

export async function POST() {
  const employee = await getOrCreateEmployee();
  await resetOnboarding(employee.id);
  return NextResponse.json({ ok: true });
}
