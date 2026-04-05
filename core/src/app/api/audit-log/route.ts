import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const userId = req.nextUrl.searchParams.get("userId");
  const entity = req.nextUrl.searchParams.get("entity");
  const entityId = req.nextUrl.searchParams.get("entityId");

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(entity && { entity }),
      ...(entityId && { entityId }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(auditLogs);
}
