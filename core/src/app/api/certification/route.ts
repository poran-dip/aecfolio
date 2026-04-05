import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  const certifications = await prisma.certification.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(certifications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, name, issuer, issueDate, proofImage } = body;

  const certification = await prisma.certification.create({
    data: { studentId, name, issuer, issueDate, proofImage },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "CREATE", entity: "Certification", entityId: certification.id });

  return NextResponse.json(certification, { status: 201 });
}
