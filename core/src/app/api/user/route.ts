import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error } = await requireRole(["FACULTY"]);
  if (error) return error;

  const pending = req.nextUrl.searchParams.get("pending");

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(pending === "true" && { role: "PENDING" }),
    },
    include: { student: true, faculty: true },
  });

  return NextResponse.json(users);
}
