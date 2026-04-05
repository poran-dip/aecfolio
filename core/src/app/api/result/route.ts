import { createAuditLog } from "@/lib/audit";
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

  const userId = req.headers.get("x-user-id")!;
  await createAuditLog({ userId, action: "CREATE", entity: "Result", entityId: result.id });

  return NextResponse.json(result, { status: 201 });
}
