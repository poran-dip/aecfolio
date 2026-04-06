import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getStudentForUser } from "@/lib/student";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const social = await prisma.social.findFirst({ where: { id } });

  if (!social) {
    return NextResponse.json({ error: "Social not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (social.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(social);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { id } = await params;

  const social = await prisma.social.findFirst({ where: { id } });

  if (!social) {
    return NextResponse.json({ error: "Social not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (social.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { url } = await req.json();

  const updated = await prisma.social.update({
    where: { id },
    data: { ...(url !== undefined && { url }) },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Social",
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

  const social = await prisma.social.findFirst({ where: { id } });

  if (!social) {
    return NextResponse.json({ error: "Social not found" }, { status: 404 });
  }

  if (session.user.role === "STUDENT") {
    const student = await getStudentForUser(session.user.id);
    if (social.studentId !== student?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await prisma.social.delete({ where: { id } });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Social",
    entityId: id,
  });

  return NextResponse.json(deleted);
}
