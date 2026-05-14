import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// Bulk approve: flip role to STUDENT
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { ids } = (await req.json()) as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  const students = await prisma.student.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { userId: true, id: true },
  });

  await prisma.user.updateMany({
    where: { id: { in: students.map((s) => s.userId) } },
    data: { role: "STUDENT" },
  });

  await Promise.all(
    students.map((s) =>
      createAuditLog({
        userId: session.user.id,
        action: "VERIFY",
        entity: "Student",
        entityId: s.id,
      }),
    ),
  );

  return NextResponse.json({ approved: students.length });
}
