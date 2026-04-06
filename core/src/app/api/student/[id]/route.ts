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

  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    include: { user: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // students can only edit their own profile
  if (session.user.role === "STUDENT" && student.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rollNo, course, branch, semester, bio, skills, cgpa } =
    await req.json();

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(rollNo !== undefined && { rollNo }),
      ...(course !== undefined && { course }),
      ...(branch !== undefined && { branch }),
      ...(semester !== undefined && { semester }),
      ...(bio !== undefined && { bio }),
      ...(skills !== undefined && { skills }),
      ...(cgpa !== undefined && { cgpa }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Student",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT" && student.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Student",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
