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

  const socials = await prisma.social.findMany({
    where: { ...(studentId && { studentId }) },
  });

  return NextResponse.json(socials);
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

  const { type, url } = await req.json();

  const social = await prisma.social.create({
    data: { studentId: student.id, type, url },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Social",
    entityId: social.id,
  });

  return NextResponse.json(social, { status: 201 });
}
