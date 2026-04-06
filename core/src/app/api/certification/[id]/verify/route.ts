import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const certification = await prisma.certification.update({
    where: { id },
    data: {
      verified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "VERIFY",
    entity: "Certification",
    entityId: id,
  });

  return NextResponse.json(certification);
}
