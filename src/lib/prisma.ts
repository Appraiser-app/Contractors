import { PrismaClient } from "@prisma/client";

// Supabase pooler URLs (port 6543) can fail with "Tenant or user not found".
// We convert pooler URL to direct connection URL (port 5432) automatically.
function getDirectUrl(): string | undefined {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return undefined;

  // Already a direct connection or non-Supabase URL
  if (!dbUrl.includes("pooler.supabase.com")) return dbUrl;

  try {
    // Pooler format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
    const match = dbUrl.match(/postgres\.([^:]+):([^@]+)@/);
    if (match) {
      const [, projectRef, password] = match;
      return `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  } catch {}

  return dbUrl;
}

const directUrl = getDirectUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: directUrl ? { db: { url: directUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
