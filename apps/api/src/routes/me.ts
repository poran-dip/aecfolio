import { studentsTable, usersTable } from "@aecfolio/db";
import {
  UploadPurpose,
  updateStudentProfileSchema,
  updateUserSchema,
} from "@aecfolio/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getFacultyForUser, getStudentForUser } from "../lib/actor";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { Capability } from "../lib/capabilities";
import { db } from "../lib/db";
import {
  loadStudentProfile,
  ProfileView,
  projectStudentProfile,
} from "../lib/profile";
import { fail, getUser, ok } from "../lib/response";
import { rejectInvalidUpload } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

const me = new Hono<AppEnv>()
  .get("/", requireAuth(), async (c) => {
    const user = getUser(c);

    const result = await db.query.usersTable.findFirst({
      where: (u, { and, eq, isNull }) =>
        and(eq(u.id, user.id), isNull(u.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      with: { student: true, faculty: true },
    });

    if (!result) return fail(c, "NOT_FOUND", "User not found", 404);
    return ok(c, result);
  })

  .patch("/", requireAuth(), validate("json", updateUserSchema), async (c) => {
    const user = getUser(c);
    const body = c.req.valid("json");

    const [before] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const invalid = await rejectInvalidUpload(
      c,
      "image",
      body.image,
      UploadPurpose.AVATAR,
      user.id,
      before?.image,
    );
    if (invalid) return invalid;

    const [updated] = await db
      .update(usersTable)
      .set(body)
      .where(eq(usersTable.id, user.id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: diff(before, updated),
    });
    return ok(c, updated);
  })

  .get(
    "/profile",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    async (c) => {
      const user = getUser(c);

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const profile = await loadStudentProfile(student.id);
      if (!profile)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      return ok(c, projectStudentProfile(profile, ProfileView.OWNER));
    },
  )

  .patch(
    "/student",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", updateStudentProfileSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const student = await getStudentForUser(user.id);
      if (!student)
        return fail(c, "NOT_FOUND", "Student profile not found", 404);

      const [before] = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.id, student.id))
        .limit(1);

      const [updated] = await db
        .update(studentsTable)
        .set(body)
        .where(eq(studentsTable.id, student.id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.STUDENT,
        entityId: student.id,
        metadata: diff(before, updated),
      });
      return ok(c, updated);
    },
  )

  .get("/faculty", requireAuth(), async (c) => {
    const user = getUser(c);

    const faculty = await getFacultyForUser(user.id);
    if (!faculty) return fail(c, "NOT_FOUND", "Faculty profile not found", 404);

    return ok(c, faculty);
  });

export default me;
