import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const experience = await prisma.experience.findFirst({
    where: { id, deletedAt: null },
  });

  if (!experience) {
    return NextResponse.json(
      { error: "Experience not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (experience.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(experience);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const experience = await prisma.experience.findFirst({
    where: { id, deletedAt: null },
  });

  if (!experience) {
    return NextResponse.json(
      { error: "Experience not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (experience.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { type, title, organization, description, startDate, endDate } =
    await req.json();

  const updated = await prisma.experience.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(organization !== undefined && { organization }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Experience",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const experience = await prisma.experience.findFirst({
    where: { id, deletedAt: null },
  });

  if (!experience) {
    return NextResponse.json(
      { error: "Experience not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (experience.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await prisma.experience.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Experience",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
