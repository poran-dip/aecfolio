import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
    },
    include: {
      student: {
        include: {
          user: true,
          experiences: {
            where: {
              deletedAt: null,
            },
          },
          projects: {
            where: {
              deletedAt: null,
            },
          },
          achievements: {
            where: {
              deletedAt: null,
            },
          },
          certifications: {
            where: {
              deletedAt: null,
            },
          },
          socials: true,
          results: true,
        },
      },
    },
  });

  if (!user?.student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(user.student);
}
