import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
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
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const body = await req.json();
  const { name, phone, image } = body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(image !== undefined && { image }),
    },
  });

  await createAuditLog({ userId, action: "UPDATE", entity: "User", entityId: userId });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({ userId, action: "DELETE", entity: "User", entityId: userId });

  return NextResponse.json(user);
}
