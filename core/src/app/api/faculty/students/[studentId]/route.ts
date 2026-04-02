import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  const session = await auth();
  if (!session?.user?.facultyId && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      results: { orderBy: { semester: "asc" } },
      achievements: true,
      certifications: true,
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.user.name,
      rollNo: student.rollNo,
      course: student.course,
      branch: student.branch,
      semester: student.semester,
      cgpa: student.cgpa,
      results: student.results,
      achievements: student.achievements,
      certifications: student.certifications,
    },
  });
}
