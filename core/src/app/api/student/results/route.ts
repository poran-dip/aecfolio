import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await prisma.result.findMany({
    where: { studentId: session.user.studentId },
    orderBy: { semester: "asc" },
  });

  return NextResponse.json({ results });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { semester, sgpa } = await req.json();
  
  if (semester < 1 || semester > 8 || sgpa < 0 || sgpa > 10) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Check if semester already exists and is verified
  const existing = await prisma.result.findUnique({
    where: { studentId_semester: { studentId: session.user.studentId, semester } }
  });

  if (existing?.verified) {
    return NextResponse.json({ error: "Cannot modify a verified result" }, { status: 403 });
  }

  const result = await prisma.result.upsert({
    where: { studentId_semester: { studentId: session.user.studentId, semester } },
    update: { sgpa },
    create: {
      studentId: session.user.studentId,
      semester,
      sgpa,
    },
  });

  // Recompute unverified CGPA if needed (though we mostly calculate on the fly)
  // For actual verified CGPA, that happens when faculty locks it.

  return NextResponse.json({ result });
}
