import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BidsClient from "./BidsClient";

export default async function ProjectBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const project = await prisma.publicProject.findUnique({ where: { id } });
  if (!project || project.authorId !== user.id) notFound();
  return <BidsClient projectId={id} />;
}
