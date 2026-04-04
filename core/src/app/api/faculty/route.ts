import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const faculty = await prisma.faculty.findMany({
    where: { deletedAt: null },
    include: { user: true },
  });

  return NextResponse.json(faculty);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { userId, employeeId, designation, department } = body;

  const faculty = await prisma.faculty.create({
    data: {
      userId,
      employeeId,
      designation,
      department,
    },
  });

  return NextResponse.json(faculty, { status: 201 });
}
