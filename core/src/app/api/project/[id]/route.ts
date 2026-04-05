import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, techStack, link } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(techStack !== undefined && { techStack }),
      ...(link !== undefined && { link }),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Project", entityId: id });

  return NextResponse.json(project);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Project", entityId: id });

  return NextResponse.json(project);
}
