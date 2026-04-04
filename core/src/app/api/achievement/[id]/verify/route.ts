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

  const achievement = await prisma.achievement.update({
    where: { id },
    data: {
      verified: true,
      verifiedBy,
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json(achievement);
}
