import { NextResponse } from "next/server";
import { getOrCreateEmployee } from "@/lib/server/session";
import { getSnapshot } from "@/lib/server/onboardingRepository";

export const runtime = "nodejs";

export async function GET() {
  const employee = await getOrCreateEmployee();
  const snapshot = await getSnapshot(employee.id);
  return NextResponse.json(snapshot);
}
