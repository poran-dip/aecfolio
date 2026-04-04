import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const social = await prisma.social.findFirst({
    where: { id },
  });

  if (!social) {
    return NextResponse.json({ error: "Social not found" }, { status: 404 });
  }

  return NextResponse.json(social);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { url } = body;

  const social = await prisma.social.update({
    where: { id },
    data: {
      ...(url !== undefined && { url }),
    },
  });

  return NextResponse.json(social);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const social = await prisma.social.delete({
    where: { id },
  });

  return NextResponse.json(social);
}
