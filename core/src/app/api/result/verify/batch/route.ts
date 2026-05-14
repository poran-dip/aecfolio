import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { ids } = (await req.json()) as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  const results = await prisma.result.findMany({
    where: { id: { in: ids }, pendingSgpa: { not: null } },
  });

  if (results.length === 0)
    return NextResponse.json(
      { error: "No verifiable results found" },
      { status: 400 },
    );

  await Promise.all(
    results.map((r) =>
      prisma.result.update({
        where: { id: r.id },
        data: {
          verified: true,
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          sgpa: r.pendingSgpa,
        },
      }),
    ),
  );

  await Promise.all(
    results.map((r) =>
      createAuditLog({
        userId: session.user.id,
        action: "VERIFY",
        entity: "Result",
        entityId: r.id,
      }),
    ),
  );

  return NextResponse.json({ verified: results.length });
}
