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

  const achievement = await prisma.achievement.findFirst({
    where: { id, deletedAt: null },
  });

  if (!achievement) {
    return NextResponse.json(
      { error: "Achievement not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (achievement.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(achievement);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const achievement = await prisma.achievement.findFirst({
    where: { id, deletedAt: null },
  });

  if (!achievement) {
    return NextResponse.json(
      { error: "Achievement not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (achievement.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { title, description, proofImage } = await req.json();

  const updated = await prisma.achievement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(proofImage !== undefined && { proofImage }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Achievement",
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

  const achievement = await prisma.achievement.findFirst({
    where: { id, deletedAt: null },
  });

  if (!achievement) {
    return NextResponse.json(
      { error: "Achievement not found" },
      { status: 404 },
    );
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (achievement.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await prisma.achievement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Achievement",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
