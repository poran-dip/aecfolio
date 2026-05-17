import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "STUDENT",
  "FACULTY",
  "ADMIN",
  "PENDING",
]);
export const courseEnum = pgEnum("course", ["BTECH", "MTECH", "BCA", "MCA"]);
export const branchEnum = pgEnum("branch", [
  "CSE",
  "ETE",
  "EE",
  "IE",
  "ME",
  "CE",
  "IPE",
  "CHE",
  "CA",
]);
