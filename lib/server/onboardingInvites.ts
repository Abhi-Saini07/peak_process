import "server-only";
import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/site";

/**
 * One-time onboarding links. The token is 32 random bytes (base64url) and
 * only its SHA-256 is stored, so a database leak can't be turned into
 * working links. Links last 14 days and work once.
 */

export const INVITE_TTL_DAYS = 14;

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function onboardingStartUrl(token: string): string {
  return absoluteUrl(`/onboarding/start/${token}`);
}

/** Creates a fresh invite (and expires any older unused ones). Returns the
 *  raw token: the only time it exists outside the email/link. */
export async function createOnboardingInvite(
  employeeId: string,
  createdByAdminId: string | null,
  db: Prisma.TransactionClient = prisma,
  now = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.onboardingInvite.updateMany({
    where: { employeeId, usedAt: null, expiresAt: { gt: now } },
    data: { expiresAt: now },
  });
  await db.onboardingInvite.create({
    data: { employeeId, tokenHash: hashInviteToken(token), expiresAt, createdByAdminId },
  });
  return { token, expiresAt };
}

export type InviteRedemption =
  | { status: "ok"; employeeId: string; sessionToken: string }
  | { status: "already_yours"; sessionToken: string }
  | { status: "invalid" | "expired" | "used" };

/**
 * Checks a link and, if it's good, marks it used. The claim is atomic
 * (updateMany where usedAt IS NULL, count must be 1), so two clicks racing
 * can't both get through. `currentSessionToken` lets the person who already
 * used the link on this browser carry on instead of seeing "used".
 */
export async function redeemOnboardingInvite(
  token: string,
  currentSessionToken: string | null,
  now = new Date(),
): Promise<InviteRedemption> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { status: "invalid" };
  const invite = await prisma.onboardingInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: { employee: { select: { id: true, sessionToken: true } } },
  });
  if (!invite) return { status: "invalid" };

  if (invite.usedAt) {
    return currentSessionToken && currentSessionToken === invite.employee.sessionToken
      ? { status: "already_yours", sessionToken: invite.employee.sessionToken }
      : { status: "used" };
  }
  if (invite.expiresAt <= now) return { status: "expired" };

  const claimed = await prisma.onboardingInvite.updateMany({
    where: { id: invite.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) return { status: "used" };
  return { status: "ok", employeeId: invite.employee.id, sessionToken: invite.employee.sessionToken };
}
