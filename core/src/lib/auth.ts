import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? "";
      // Restrict to @aecian.ac.in institutional emails only
      if (!email.endsWith("@aecian.ac.in")) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            student: { select: { id: true } },
            faculty: { select: { id: true } },
          },
        });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.studentId = dbUser.student?.id;
          session.user.facultyId = dbUser.faculty?.id;
        }
      }
      return session;
    },
  },
});
