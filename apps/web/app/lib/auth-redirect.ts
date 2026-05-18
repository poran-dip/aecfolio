import { redirect } from "react-router";

const ROLE_ROUTES: Record<string, string> = {
  PENDING: "/pending",
  STUDENT: "/student",
  FACULTY: "/faculty",
};

export function redirectByRole(role: string): never {
  throw redirect(ROLE_ROUTES[role] ?? "/");
}
