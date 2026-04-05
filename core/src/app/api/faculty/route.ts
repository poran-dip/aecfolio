import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const faculty = await prisma.faculty.findMany({
    where: { deletedAt: null },
    include: { user: true },
  });

  return NextResponse.json(faculty);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { userId, employeeId, designation, department } = body;

  const existing = await prisma.user.findFirst({
    where: { id: userId },
    include: { student: true, faculty: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (existing.faculty) {
    return NextResponse.json({ error: "User already has a faculty profile" }, { status: 409 });
  }
  if (existing.student) {
    return NextResponse.json({ error: "User already has a student profile" }, { status: 409 });
  }

  const faculty = await prisma.faculty.create({
    data: {
      userId,
      employeeId,
      designation,
      department,
    },
  });

  const actorId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId: actorId, action: "CREATE", entity: "Faculty", entityId: faculty.id });

  return NextResponse.json(faculty, { status: 201 });
}
