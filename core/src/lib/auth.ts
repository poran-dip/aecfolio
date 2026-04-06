import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      return user.email?.endsWith("@aec.ac.in") ?? false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.image = user.image;
        token.phone = user.phone;
      }
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.image = token.image as string;
      session.user.phone = token.phone as string;
      return session;
    },
  },
});
