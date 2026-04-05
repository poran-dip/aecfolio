"use server";

import { signIn } from "@/lib/auth";

export async function handleSignIn() {
  await signIn("google");
}
