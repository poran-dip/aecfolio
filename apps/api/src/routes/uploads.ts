import {
  Capability,
  createUploadSchema,
  hasCapability,
  UploadPurpose,
} from "@aecfolio/shared";
import { Hono } from "hono";
import { resolveOwnStudent } from "../lib/ownership";
import { fail, getUser, ok } from "../lib/response";
import { issueUpload } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const uploads = new Hono<AppEnv>().post(
  "/",
  requireAuth(),
  validate("json", createUploadSchema),
  async (c) => {
    const user = getUser(c);
    const { purpose, contentType, size } = c.req.valid("json");

    let ownerId = user.id;
    if (purpose === UploadPurpose.PROOF) {
      if (!hasCapability(user.role, Capability.PROFILE_WRITE_SELF))
        return fail(c, "FORBIDDEN", "Forbidden", 403);
      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;
      ownerId = scope.studentId;
    }

    return ok(c, await issueUpload(purpose, ownerId, contentType, size), 201);
  },
);

export default uploads;
