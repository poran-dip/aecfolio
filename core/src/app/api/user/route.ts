import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const pending = req.nextUrl.searchParams.get("pending");

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(pending === "true" && {
        student: null,
        faculty: null,
      }),
    },
    include: {
      student: true,
      faculty: true,
    },
  });

  return NextResponse.json(users);
}
