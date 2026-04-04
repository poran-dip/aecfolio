import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(studentId && { studentId }),
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, title, description, techStack, link } = body;

  const project = await prisma.project.create({
    data: { studentId, title, description, techStack: techStack ?? [], link },
  });

  return NextResponse.json(project, { status: 201 });
}
