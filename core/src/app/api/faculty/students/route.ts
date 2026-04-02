import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.facultyId && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If Admin, all students. If Faculty, only students in their department (for demo we query all to make it easier to test)
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true } },
      results: { select: { verified: true } },
      achievements: { select: { verified: true } },
    },
  });

  const formatted = students.map((s) => ({
    id: s.id,
    name: s.user.name,
    rollNo: s.rollNo,
    course: s.course,
    semester: s.semester,
    cgpa: s.cgpa,
    unverifiedResults: s.results.filter((r) => !r.verified).length,
    unverifiedAchievements: s.achievements.filter((a) => !a.verified).length,
  }));

  return NextResponse.json({ students: formatted });
}
