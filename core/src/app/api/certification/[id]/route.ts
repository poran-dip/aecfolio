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

  return NextResponse.json(certification);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const certification = await prisma.certification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json(certification);
}
