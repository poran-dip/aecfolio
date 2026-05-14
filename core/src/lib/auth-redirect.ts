import { redirect } from "next/navigation";

const ROLE_ROUTES: Record<string, string> = {
  PENDING: "/pending",
  STUDENT: "/student",
  FACULTY: "/faculty",
};

export const redirectByRole = (role: string) => {
  redirect(ROLE_ROUTES[role] ?? "/");
};
