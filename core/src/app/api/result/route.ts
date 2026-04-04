import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  const results = await prisma.result.findMany({
    where: {
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, semester, sgpa, pendingSgpa } = body;

  const result = await prisma.result.create({
    data: { studentId, semester, sgpa, pendingSgpa },
  });

  return NextResponse.json(result, { status: 201 });
}
