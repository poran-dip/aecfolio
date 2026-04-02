import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCGPA } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: { resultId: string } }
) {
  const session = await auth();
  if (!session?.user?.facultyId && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resultId } = params;

  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update result as verified
  const updatedResult = await prisma.result.update({
    where: { id: resultId },
    data: {
      verified: true,
      verifiedBy: session.user.facultyId ?? session.user.id,
      verifiedAt: new Date(),
    },
  });

  // Re-calculate the official CGPA for the student (only counting verified results)
  const allVerified = await prisma.result.findMany({
    where: { studentId: result.studentId, verified: true },
    select: { sgpa: true },
  });

  const newCgpa = calculateCGPA(allVerified.map(r => r.sgpa));

  await prisma.student.update({
    where: { id: result.studentId! },
    data: { cgpa: newCgpa },
  });

  // Write audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "VERIFY_RESULT",
      entity: "Result",
      entityId: resultId,
      metadata: { semester: result.semester, sgpa: result.sgpa, newCgpa },
    },
  });

  return NextResponse.json({ success: true, cgpa: newCgpa });
}
