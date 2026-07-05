import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ participant1: user.id }, { participant2: user.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const otherIds = convos.map((c) => (c.participant1 === user.id ? c.participant2 : c.participant1));
  const profiles = await prisma.profile.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, avatarUrl: true, trade: true, userRole: true },
  });
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const enriched = convos.map((c) => {
    const otherId = c.participant1 === user.id ? c.participant2 : c.participant1;
    return { ...c, other: profileMap[otherId] || null, lastMessage: c.messages[0] || null };
  });

  return NextResponse.json({ conversations: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otherUserId } = await req.json();
  if (!otherUserId) return NextResponse.json({ error: "otherUserId required" }, { status: 400 });

  const [p1, p2] = [user.id, otherUserId].sort();

  let convo = await prisma.conversation.findUnique({ where: { participant1_participant2: { participant1: p1, participant2: p2 } } });
  if (!convo) {
    convo = await prisma.conversation.create({ data: { participant1: p1, participant2: p2 } });
  }

  return NextResponse.json({ conversation: convo });
}
