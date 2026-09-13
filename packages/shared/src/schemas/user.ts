import { z } from "zod";
import { Role } from "../enums";
import { softDeleteFields, timestampFields } from "./common";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  phone: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(Role),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  ...timestampFields,
  ...softDeleteFields,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().nullable().optional(),
  image: z.url().nullable().optional(),
});

export const setUserRoleSchema = z.object({
  role: z.enum(Role),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
