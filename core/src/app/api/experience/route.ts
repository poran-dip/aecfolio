import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const type = req.nextUrl.searchParams.get("type");

  const experiences = await prisma.experience.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
      ...(type && { type: type as any }),
    },
  });

  return NextResponse.json(experiences);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, type, title, organization, description, startDate, endDate } = body;

  const experience = await prisma.experience.create({
    data: { studentId, type, title, organization, description, startDate, endDate },
  });

  return NextResponse.json(experience, { status: 201 });
}
