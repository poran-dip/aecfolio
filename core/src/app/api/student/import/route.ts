import { type NextRequest, NextResponse } from "next/server";
import type { Branch, Course } from "@/generated/prisma/client";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

interface ImportRow {
  name: string;
  email: string;
  rollNo: string;
  course: Course;
  branch: Branch;
  semester: number;
  cgpa?: number | null;
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { students } = (await req.json()) as { students: ImportRow[] };
  if (!Array.isArray(students) || students.length === 0)
    return NextResponse.json(
      { error: "No students provided" },
      { status: 400 },
    );

  const results = await Promise.allSettled(
    students.map(async (row) => {
      // Check for existing user/roll conflicts before creating
      const [existingUser, existingRoll] = await Promise.all([
        prisma.user.findUnique({ where: { email: row.email } }),
        prisma.student.findUnique({ where: { rollNo: row.rollNo } }),
      ]);

      if (existingUser) throw new Error(`Email already exists: ${row.email}`);
      if (existingRoll)
        throw new Error(`Roll number already exists: ${row.rollNo}`);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: row.name,
            email: row.email,
            role: "STUDENT",
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            rollNo: row.rollNo,
            course: row.course,
            branch: row.branch,
            semester: row.semester,
            cgpa: row.cgpa ?? null,
            skills: [],
          },
        });

        return { user, student };
      });

      await createAuditLog({
        userId: session.user.id,
        action: "CREATE",
        entity: "Student",
        entityId: result.student.id,
      });

      return { email: row.email, rollNo: row.rollNo };
    }),
  );

  const created: string[] = [];
  const errors: { row: string; reason: string }[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") created.push(r.value.email);
    else errors.push({ row: "", reason: r.reason?.message ?? "Unknown error" });
  }

  return NextResponse.json({ created: created.length, errors });
}
