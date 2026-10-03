import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * AdminAuditLog: who did what to which record. Use it for every sensitive
 * admin action (revealing government IDs, hiring, team changes...). Pass a
 * transaction client to log inside the same transaction as the change, so a
 * rolled-back change leaves no log line and a logged change can't be lost.
 */
export type AuditEntry = {
  actorAdminId: string | null;
  /** Dotted verb, e.g. "employee.reveal_ids", "application.hire". */
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
};

export async function logAdminAction(entry: AuditEntry, db: Prisma.TransactionClient = prisma): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      actorAdminId: entry.actorAdminId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      meta: entry.meta,
    },
  });
}
