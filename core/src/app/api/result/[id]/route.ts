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

  const result = await prisma.result.findFirst({ where: { id } });

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (result.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const { id } = await params;

  const result = await prisma.result.findFirst({ where: { id } });

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  const student = await getStudentForUser(session.user.id);
  if (result.studentId !== student?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pendingSgpa } = await req.json();

  const updated = await prisma.result.update({
    where: { id },
    data: { ...(pendingSgpa !== undefined && { pendingSgpa }) },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Result",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(["STUDENT"]);
  if (error) return error;

  const { id } = await params;

  const result = await prisma.result.findFirst({ where: { id } });

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  const student = await getStudentForUser(session.user.id);
  if (result.studentId !== student?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await prisma.result.delete({ where: { id } });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Result",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
