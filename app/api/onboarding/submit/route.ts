import { NextResponse } from "next/server";
import { getOrCreateEmployee } from "@/lib/server/session";
import { submitOnboarding } from "@/lib/server/onboardingRepository";

export const runtime = "nodejs";

export async function POST() {
  const employee = await getOrCreateEmployee();
  const result = await submitOnboarding(employee.id);

  if ("error" in result) {
    return NextResponse.json(result, { status: 422 });
  }
  return NextResponse.json(result);
}
