import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";

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

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(projects);
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

  const { title, description, techStack, link } = await req.json();

  const project = await prisma.project.create({
    data: {
      studentId: student.id,
      title,
      description,
      techStack: techStack ?? [],
      link,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Project",
    entityId: project.id,
  });

  return NextResponse.json(project, { status: 201 });
}
