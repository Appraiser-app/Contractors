import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trade = searchParams.get("trade");
  const zipCode = searchParams.get("zipCode");
  const userRole = searchParams.get("userRole"); // GC | SUB
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (trade) where.trade = trade;
  if (zipCode) where.zipCode = zipCode;
  if (userRole) where.userRole = userRole;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { businessName: { contains: q, mode: "insensitive" } },
      { trade: { contains: q, mode: "insensitive" } },
    ];
  }

  const professionals = await prisma.profile.findMany({
    where,
    select: {
      id: true, name: true, businessName: true, avatarUrl: true, trade: true,
      userRole: true, zipCode: true, rating: true, ratingCount: true,
      isVerified: true, bio: true, serviceRadius: true,
    },
    orderBy: { rating: "desc" },
    take: 50,
  });

  return NextResponse.json({ professionals });
}
