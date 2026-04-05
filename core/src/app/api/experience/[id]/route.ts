import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experience = await prisma.experience.findFirst({
    where: { id, deletedAt: null },
  });

  if (!experience) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  return NextResponse.json(experience);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { type, title, organization, description, startDate, endDate } = body;

  const experience = await prisma.experience.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(organization !== undefined && { organization }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Experience", entityId: id });

  return NextResponse.json(experience);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experience = await prisma.experience.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Experience", entityId: id });

  return NextResponse.json(experience);
}
