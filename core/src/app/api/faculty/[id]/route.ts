import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

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
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  const { employeeId, designation, department } = await req.json();

  const updated = await prisma.faculty.update({
    where: { id },
    data: {
      ...(employeeId !== undefined && { employeeId }),
      ...(designation !== undefined && { designation }),
      ...(department !== undefined && { department }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Faculty",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  const deleted = await prisma.faculty.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Faculty",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
