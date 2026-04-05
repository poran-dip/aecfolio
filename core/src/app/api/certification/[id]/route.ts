import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const certification = await prisma.certification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!certification) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  return NextResponse.json(certification);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, issuer, issueDate, proofImage } = body;

  const certification = await prisma.certification.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(issuer !== undefined && { issuer }),
      ...(issueDate !== undefined && { issueDate }),
      ...(proofImage !== undefined && { proofImage }),
    },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "UPDATE", entity: "Certification", entityId: id });

  return NextResponse.json(certification);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const certification = await prisma.certification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "DELETE", entity: "Certification", entityId: id });

  return NextResponse.json(certification);
}
