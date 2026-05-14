import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  try {
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { name: true } },
        results: { select: { verified: true } },
        achievements: { select: { verified: true } },
      },
    });

    const formatted = students.map((stu) => ({
      id: stu.id,
      name: stu.user?.name || "Unknown",
      rollNo: stu.rollNo,
      course: stu.course,
      semester: stu.semester,
      cgpa: stu.cgpa,

      unverifiedResults: stu.results.filter((r) => !r.verified).length,
      unverifiedAchievements: stu.achievements.filter((a) => !a.verified)
        .length,
    }));

    return NextResponse.json({ students: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  try {
    const students = await prisma.student.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        user: true,
        experiences: true,
        projects: true,
        achievements: true,
        certifications: true,
        socials: true,
        results: true,
      },
    });
    return NextResponse.json({ students });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
