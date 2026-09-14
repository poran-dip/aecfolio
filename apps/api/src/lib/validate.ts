import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { fail } from "./response";

export function validate<
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success)
      return fail(
        c,
        "VALIDATION",
        "Validation failed",
        400,
        result.error.issues,
      );
  });
}
