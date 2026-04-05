import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const achievement = await prisma.achievement.findFirst({
    where: { id, deletedAt: null },
  });

  if (!achievement) {
    return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
  }

  return NextResponse.json(achievement);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, proofImage } = body;

  const achievement = await prisma.achievement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(proofImage !== undefined && { proofImage }),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Achievement", entityId: id });

  return NextResponse.json(achievement);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const achievement = await prisma.achievement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Achievement", entityId: id });

  return NextResponse.json(achievement);
}
