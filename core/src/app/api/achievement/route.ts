import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  let studentId = null;
  const paramStudentId = req.nextUrl.searchParams.get("studentId");

  if (session.user.role === "FACULTY" && paramStudentId) {
    studentId = paramStudentId;
  } else if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (!student)
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 },
      );
    studentId = student.id;
  }

  const achievements = await prisma.achievement.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(achievements);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const student = await getStudentForUser(session.user.id);

  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 },
    );
  }

  const body = await req.json();
  const { title, description, proofImage } = body;

  const achievement = await prisma.achievement.create({
    data: { studentId: student.id, title, description, proofImage },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Achievement",
    entityId: achievement.id,
  });

  return NextResponse.json(achievement, { status: 201 });
}
