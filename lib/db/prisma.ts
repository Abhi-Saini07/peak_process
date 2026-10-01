import { PrismaClient } from "@prisma/client";

// Standard Next.js + Prisma singleton: in dev, Fast Refresh re-evaluates
// this module on every edit, which would otherwise spawn a fresh
// PrismaClient (and a fresh connection pool) each time until the DB's
// max_connections is exhausted. Caching the instance on `globalThis`
// survives module reloads; in production each serverless invocation gets
// its own clean instance, which is what we want there.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
