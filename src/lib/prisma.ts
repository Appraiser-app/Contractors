import { PrismaClient } from "@prisma/client";

// Supabase pgBouncer (port 6543) requires ?pgbouncer=true for Prisma
function getDbUrl(): string | undefined {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return undefined;

  // Add pgbouncer=true if using Supabase pooler and not already set
  if (dbUrl.includes("pooler.supabase.com") && !dbUrl.includes("pgbouncer=true")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    return `${dbUrl}${separator}pgbouncer=true`;
  }

  return dbUrl;
}

const dbUrl = getDbUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
