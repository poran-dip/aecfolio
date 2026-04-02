import { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      studentId?: string;
      facultyId?: string;
    } & DefaultSession["user"];
  }
}
