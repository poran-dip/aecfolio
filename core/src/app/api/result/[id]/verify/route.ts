import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const result = await prisma.result.findFirst({ where: { id } });

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  if (result.pendingSgpa === null) {
    return NextResponse.json(
      { error: "No pending SGPA to verify" },
      { status: 400 },
    );
  }

  const updated = await prisma.result.update({
    where: { id },
    data: {
      verified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      sgpa: result.pendingSgpa,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "VERIFY",
    entity: "Result",
    entityId: id,
  });

  return NextResponse.json(updated);
}
