import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;

  const comments = await prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  const authorIds = [...new Set(comments.map((c) => c.authorId))];
  const authors = await prisma.profile.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

  return NextResponse.json({ comments: comments.map((c) => ({ ...c, author: authorMap[c.authorId] })) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const comment = await prisma.postComment.create({ data: { postId, authorId: user.id, content } });
  const author = await prisma.profile.findUnique({ where: { id: user.id }, select: { id: true, name: true, avatarUrl: true } });
  return NextResponse.json({ comment: { ...comment, author } });
}
