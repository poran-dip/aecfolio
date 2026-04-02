import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const minCgpa = parseFloat(url.searchParams.get("minCgpa") || "0");
  const branch = url.searchParams.get("branch");
  const skill = url.searchParams.get("skill");

  // Prisma query dynamically building conditions
  const conditions: any = {
    cgpa: { gte: minCgpa }, // Only filter by official locked CGPA
  };

  if (branch) {
    conditions.branch = branch;
  }
  
  if (skill) {
    conditions.skills = {
      has: skill // Prisma array filtering
    };
  }

  const students = await prisma.student.findMany({
    where: conditions,
    include: {
      user: { select: { name: true } },
    },
    orderBy: { cgpa: "desc" },
  });

  const formatted = students.map((s) => ({
    id: s.id,
    name: s.user.name,
    rollNo: s.rollNo,
    branch: s.branch,
    cgpa: s.cgpa || 0,
    skills: s.skills,
  }));

  return NextResponse.json({ results: formatted });
}
