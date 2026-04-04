import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await prisma.result.findFirst({
    where: { id },
  });

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { sgpa, pendingSgpa } = body;

  const result = await prisma.result.update({
    where: { id },
    data: {
      ...(sgpa !== undefined && { sgpa }),
      ...(pendingSgpa !== undefined && { pendingSgpa }),
    },
  });

  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await prisma.result.delete({
    where: { id },
  });

  return NextResponse.json(result);
}
