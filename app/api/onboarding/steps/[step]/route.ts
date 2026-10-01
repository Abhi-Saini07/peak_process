import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateEmployee } from "@/lib/server/session";
import { saveStep } from "@/lib/server/onboardingRepository";
import type { SavableStepId } from "@/lib/persistence/types";

export const runtime = "nodejs";

const VALID_STEPS: readonly SavableStepId[] = [
  "welcome",
  "personalInfo",
  "references",
  "emergencyContact",
  "healthInsurance",
  "documents",
];

export async function POST(request: NextRequest, ctx: RouteContext<"/api/onboarding/steps/[step]">) {
  const { step } = await ctx.params;
  if (!VALID_STEPS.includes(step as SavableStepId)) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  const data = await request.json().catch(() => null);
  const employee = await getOrCreateEmployee();
  await saveStep(employee.id, step as SavableStepId, data);

  return NextResponse.json({ savedAt: new Date().toISOString() });
}
