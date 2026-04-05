import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
    include: { user: true },
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  return NextResponse.json(faculty);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { employeeId, designation, department } = body;

  const faculty = await prisma.faculty.update({
    where: { id },
    data: {
      ...(employeeId !== undefined && { employeeId }),
      ...(designation !== undefined && { designation }),
      ...(department !== undefined && { department }),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Faculty", entityId: id });

  return NextResponse.json(faculty);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const faculty = await prisma.faculty.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Faculty", entityId: id });

  return NextResponse.json(faculty);
}
