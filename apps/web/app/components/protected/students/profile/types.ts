import type { Student, User } from "@aecfolio/shared";

export type UserWithStudent = User & { student: Student };
