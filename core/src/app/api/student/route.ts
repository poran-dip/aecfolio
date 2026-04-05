import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const students = await prisma.student.findMany({
    where: { deletedAt: null },
    include: { user: true },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { userId, rollNo, course, branch, semester, bio, skills, cgpa } = body;

  const existing = await prisma.user.findFirst({
    where: { id: userId },
    include: { student: true, faculty: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (existing.student) {
    return NextResponse.json({ error: "User already has a student profile" }, { status: 409 });
  }
  if (existing.faculty) {
    return NextResponse.json({ error: "User already has a faculty profile" }, { status: 409 });
  }

  const student = await prisma.student.create({
    data: {
      userId,
      rollNo,
      course,
      branch,
      semester,
      bio,
      skills: skills ?? [],
      cgpa,
    },
  });

  const actorId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId: actorId, action: "CREATE", entity: "Student", entityId: student.id });

  return NextResponse.json(student, { status: 201 });
}
