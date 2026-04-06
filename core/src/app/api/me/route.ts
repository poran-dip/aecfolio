import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    include: {
      student: true,
      faculty: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const { name, phone, image } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(image !== undefined && { image }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "User",
    entityId: session.user.id,
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest) {
  const { session, error } = await requireRole(["STUDENT", "FACULTY"]);
  if (error) return error;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "User",
    entityId: session.user.id,
  });

  return NextResponse.json(user);
}
