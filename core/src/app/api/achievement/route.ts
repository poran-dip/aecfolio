import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  const achievements = await prisma.achievement.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(achievements);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, title, description, proofImage } = body;

  const achievement = await prisma.achievement.create({
    data: { studentId, title, description, proofImage },
  });

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "CREATE", entity: "Achievement", entityId: achievement.id });

  return NextResponse.json(achievement, { status: 201 });
}
