import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  try {
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
        results: true,
        achievements: true,
      },
    });

    const formatted = students.map((stu) => ({
      id: stu.id,
      name: stu.user?.name || "Unknown",
      rollNo: stu.rollNo,
      course: stu.course,
      semester: stu.semester,
      cgpa: stu.cgpa,

      unverifiedResults: stu.results.filter(r => !r.verified).length,
      unverifiedAchievements: stu.achievements.filter(a => !a.verified).length,
    }));

    return NextResponse.json({ students: formatted });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}