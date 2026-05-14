import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["PENDING"]);
  if (error) return error;

  const { rollNo, course, branch, semester } = await req.json();

  if (!rollNo || !course || !branch || !semester) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.student.findFirst({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Onboarding already completed" }, { status: 409 });
  }

  const rollConflict = await prisma.student.findUnique({ where: { rollNo } });
  if (rollConflict) {
    return NextResponse.json({ error: "Roll number already in use" }, { status: 409 });
  }

  const student = await prisma.student.create({
    data: {
      userId: session.user.id,
      rollNo,
      course,
      branch,
      semester: parseInt(semester, 10),
      skills: [],
    },
  });

  return NextResponse.json(student, { status: 201 });
}
