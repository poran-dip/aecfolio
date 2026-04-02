import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let student = await prisma.student.findUnique({
    where: { userId },
    include: {
      socials: true,
      results: true,
      experiences: true,
      projects: true,
      achievements: true,
      certifications: true,
    },
  });

  // If student profile doesn't exist yet, return null for it
  if (!student) {
    return NextResponse.json({
      student: null,
      user: { name: session.user.name, email: session.user.email, image: session.user.image },
      counts: { verifiedSemesters: 0, totalSemesters: 0, projects: 0, experiences: 0, achievements: 0, certifications: 0 },
      profileCompletion: 20, // Base level for just logging in
    });
  }

  // Calculate completion
  let completion = 40; // Base details exist
  if (student.bio) completion += 10;
  if (student.phone) completion += 5;
  if (student.skills.length > 0) completion += 15;
  if (student.socials.length > 0) completion += 10;
  if (student.projects.length > 0) completion += 10;
  if (student.results.some(r => r.verified)) completion += 10;

  return NextResponse.json({
    student,
    user: { name: session.user.name, email: session.user.email, image: session.user.image },
    counts: {
      verifiedSemesters: student.results.filter((r) => r.verified).length,
      totalSemesters: student.results.length,
      projects: student.projects.length,
      experiences: student.experiences.length,
      achievements: student.achievements.length,
      certifications: student.certifications.length,
    },
    profileCompletion: Math.min(completion, 100),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { bio, phone, semester } = data;

  const student = await prisma.student.update({
    where: { id: session.user.studentId },
    data: { 
      bio: bio !== undefined ? bio : undefined,
      phone: phone !== undefined ? phone : undefined,
      semester: semester !== undefined ? Number(semester) : undefined,
    },
  });

  return NextResponse.json({ student });
}
