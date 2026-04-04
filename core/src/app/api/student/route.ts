import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const students = await prisma.student.findMany({
    where: { deletedAt: null },
    include: { user: true },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { userId, rollNo, course, branch, semester, bio, skills, cgpa } = body;

  const student = await prisma.student.create({
    data: {
      userId,
      rollNo,
      course,
      branch,
      semester,
      bio,
      skills: skills ?? [],
      cgpa,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
