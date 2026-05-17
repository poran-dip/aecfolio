import { z } from "zod";
import { Role } from "../enums";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.email(),
  emailVerified: z.boolean(),
  phone: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(Role),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  image: z.url().optional(),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
