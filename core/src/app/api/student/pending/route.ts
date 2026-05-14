import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const students = await prisma.student.findMany({
    where: { deletedAt: null, user: { role: "PENDING" } },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });

  return NextResponse.json({ students });
}
