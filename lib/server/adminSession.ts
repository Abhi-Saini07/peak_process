import "server-only";
import { cache } from "react";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminUser } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * HR/Admin access. Clerk signs people in; this app decides who is an admin:
 * a signed-in Clerk user whose *verified* email is listed in ADMIN_EMAILS
 * (comma-separated). On first visit they get an AdminUser row, linked by
 * clerkUserId, so jobs and status changes can record who made them.
 * Removing an email from ADMIN_EMAILS revokes access on the next request.
 */

export type AdminAccess =
  | { status: "signed-out" }
  | { status: "forbidden"; email: string | null }
  | { status: "ok"; admin: AdminUser };

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function linkAdminFromClerk(clerkUserId: string, allowed: Set<string>): Promise<AdminAccess> {
  const user = await currentUser();
  if (!user) return { status: "signed-out" };

  const verified = user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.trim().toLowerCase());
  const email = verified.find((e) => allowed.has(e));
  if (!email) {
    return { status: "forbidden", email: user.primaryEmailAddress?.emailAddress ?? verified[0] ?? null };
  }

  const fullName = user.fullName?.trim() || [user.firstName, user.lastName].filter(Boolean).join(" ") || email;
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { clerkUserId, fullName },
    create: { email, clerkUserId, fullName },
  });
  return { status: "ok", admin };
}

/** Deduplicated per request, so a page and its layout share one lookup. */
export const resolveAdminAccess = cache(async (): Promise<AdminAccess> => {
  const { userId } = await auth();
  if (!userId) return { status: "signed-out" };

  const allowed = allowedEmails();
  // Fast path: already linked, no call to the Clerk API.
  const linked = await prisma.adminUser.findUnique({ where: { clerkUserId: userId } });
  if (linked && allowed.has(linked.email.toLowerCase())) return { status: "ok", admin: linked };

  return linkAdminFromClerk(userId, allowed);
});

/** Nullable — for Server Components that want to render differently when logged out. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const access = await resolveAdminAccess();
  return access.status === "ok" ? access.admin : null;
}

/** Convenience wrapper for API routes: `const auth = await requireAdminUserOrResponse(); if ("response" in auth) return auth.response;` */
export async function requireAdminUserOrResponse(): Promise<{ admin: AdminUser } | { response: NextResponse }> {
  const access = await resolveAdminAccess();
  if (access.status === "signed-out") {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (access.status === "forbidden") {
    return { response: NextResponse.json({ error: "Not authorised" }, { status: 403 }) };
  }
  return { admin: access.admin };
}
