import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { verifiedBy } = body;

  if (!verifiedBy) {
    return NextResponse.json({ error: "Missing verifiedBy" }, { status: 400 });
  }

  const result = await prisma.result.update({
    where: { id },
    data: {
      verified: true,
      verifiedBy,
      verifiedAt: new Date(),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "VERIFY", entity: "Result", entityId: id });

  return NextResponse.json(result);
}
