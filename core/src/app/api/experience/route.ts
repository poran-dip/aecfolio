import { type NextRequest, NextResponse } from "next/server";
import type { ExperienceType } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";

export async function GET(req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  let studentId = null;
  const paramStudentId = req.nextUrl.searchParams.get("studentId");
  const type = req.nextUrl.searchParams.get("type");

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

  const experiences = await prisma.experience.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
      ...(type && { type: type as ExperienceType }),
    },
  });

  return NextResponse.json(experiences);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const student = await getStudentForUser(session.user.id);
  if (!student)
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 },
    );

  const { type, title, organization, description, startDate, endDate } =
    await req.json();

  const experience = await prisma.experience.create({
    data: {
      studentId: student.id,
      type,
      title,
      organization,
      description,
      startDate,
      endDate,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Experience",
    entityId: experience.id,
  });

  return NextResponse.json(experience, { status: 201 });
}
