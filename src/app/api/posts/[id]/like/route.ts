import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;

  const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId: user.id } } });

  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId: user.id } } });
    await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.postLike.create({ data: { postId, userId: user.id } });
    await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
    return NextResponse.json({ liked: true });
  }
}
