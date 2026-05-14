import { prisma } from "./prisma";

export async function getStudentForUser(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
}
