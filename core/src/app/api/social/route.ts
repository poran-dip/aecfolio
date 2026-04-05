import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  const socials = await prisma.social.findMany({
    where: {
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(socials);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, type, url } = body;

  const social = await prisma.social.create({
    data: { studentId, type, url },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "CREATE", entity: "Social", entityId: social.id });

  return NextResponse.json(social, { status: 201 });
}
