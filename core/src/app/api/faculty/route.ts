import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const faculty = await prisma.faculty.findMany({
    where: { deletedAt: null },
    include: { user: true },
  });

  return NextResponse.json(faculty);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { userId, employeeId, designation, department } = await req.json();

  const existing = await prisma.user.findFirst({
    where: { id: userId },
    include: { student: true, faculty: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (existing.faculty) {
    return NextResponse.json(
      { error: "User already has a faculty profile" },
      { status: 409 },
    );
  }
  if (existing.student) {
    return NextResponse.json(
      { error: "User already has a student profile" },
      { status: 409 },
    );
  }

  const faculty = await prisma.faculty.create({
    data: { userId, employeeId, designation, department },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: "FACULTY" },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Faculty",
    entityId: faculty.id,
  });

  return NextResponse.json(faculty, { status: 201 });
}
