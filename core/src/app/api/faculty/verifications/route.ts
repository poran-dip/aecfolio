import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  try {
    const [results, achievements, certifications] = await Promise.all([
      prisma.result.findMany({
        where: { verified: false },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),

      prisma.achievement.findMany({
        where: { verified: false, deletedAt: null },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),

      prisma.certification.findMany({
        where: { verified: false, deletedAt: null },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const shape = (type: string, id: string, name: string, proofImage: string | null | undefined, student: any) => ({
      type,
      id,
      name,
      proofImage: proofImage ?? null,
      student: {
        id: student.id,
        name: student.user?.name ?? null,
        rollNo: student.rollNo,
        department: student.department,
      },
    });

    const pending = [
      ...results.map((r) =>
        shape(
          "Result",
          r.id,
          `Semester ${r.semester} Result`,
          null,
          r.student,
        )
      ),
      ...achievements.map((a) =>
        shape("Achievement", a.id, a.title, a.proofImage, a.student)
      ),
      ...certifications.map((c) =>
        shape("Certification", c.id, c.name, c.proofImage, c.student)
      ),
    ];

    return NextResponse.json({ pending, total: pending.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch pending verifications" },
      { status: 500 },
    );
  }
}
