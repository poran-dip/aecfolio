import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (project.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (project.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { title, description, techStack, link } = await req.json();

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(techStack !== undefined && { techStack }),
      ...(link !== undefined && { link }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Project",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (project.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Project",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
