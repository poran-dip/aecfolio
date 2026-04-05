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

  const certification = await prisma.certification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!certification) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (certification.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(certification);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const certification = await prisma.certification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!certification) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (certification.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { name, issuer, issueDate, proofImage } = await req.json();

  const updated = await prisma.certification.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(issuer !== undefined && { issuer }),
      ...(issueDate !== undefined && { issueDate }),
      ...(proofImage !== undefined && { proofImage }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Certification",
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

  const certification = await prisma.certification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!certification) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (certification.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await prisma.certification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Certification",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
