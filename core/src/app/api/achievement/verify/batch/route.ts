import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  await prisma.achievement.updateMany({
    where: { id: { in: ids } },
    data: { verified: true, verifiedBy: session.user.id, verifiedAt: new Date() },
  });

  await Promise.all(
    ids.map((id) =>
      createAuditLog({ userId: session.user.id, action: "VERIFY", entity: "Achievement", entityId: id })
    )
  );

  return NextResponse.json({ verified: ids.length });
}
