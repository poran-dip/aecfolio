import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { rollNo, course, branch, semester, bio, skills, cgpa } = body;

  const student = await prisma.student.update({
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

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Student", entityId: id });

  return NextResponse.json(student);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const student = await prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Student", entityId: id });

  return NextResponse.json(student);
}
