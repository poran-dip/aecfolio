import { certificationsTable } from "@aecfolio/db";
import {
  createCertificationSchema,
  UploadPurpose,
  updateCertificationSchema,
} from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { AuditAction, AuditEntity, createAuditLog, diff } from "../lib/audit";
import { Capability } from "../lib/capabilities";
import { db } from "../lib/db";
import { resolveOwnStudent, resolveReadScope } from "../lib/ownership";
import { projectReviewable, viewForActor } from "../lib/profile";
import { fail, getUser, ok } from "../lib/response";
import { RESET_TO_PENDING } from "../lib/review";
import { redirectToObject, rejectInvalidUpload } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

async function findOwned(id: string, studentId: string) {
  const [row] = await db
    .select()
    .from(certificationsTable)
    .where(
      and(
        eq(certificationsTable.id, id),
        isNull(certificationsTable.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return { row: null, owned: false };
  return { row, owned: row.studentId === studentId };
}

const certifications = new Hono<AppEnv>()
  .get("/", requireAuth(), async (c) => {
    const user = getUser(c);
    const scope = await resolveReadScope(c, user, c.req.query("studentId"));
    if (!scope.ok) return scope.response;

    const rows = await db
      .select()
      .from(certificationsTable)
      .where(
        and(
          eq(certificationsTable.studentId, scope.studentId),
          isNull(certificationsTable.deletedAt),
        ),
      );

    return ok(c, projectReviewable(rows, viewForActor(user, scope.isOwn)));
  })

  .post(
    "/",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", createCertificationSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const invalid = await rejectInvalidUpload(
        c,
        "proofKey",
        body.proofKey,
        UploadPurpose.PROOF,
        scope.studentId,
      );
      if (invalid) return invalid;

      const [certification] = await db
        .insert(certificationsTable)
        .values({ ...body, studentId: scope.studentId })
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.CREATE,
        entity: AuditEntity.CERTIFICATION,
        entityId: certification.id,
      });
      return ok(c, certification, 201);
    },
  )

  .get("/:id", requireAuth(), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const [row] = await db
      .select()
      .from(certificationsTable)
      .where(
        and(
          eq(certificationsTable.id, id),
          isNull(certificationsTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return fail(c, "NOT_FOUND", "Certification not found", 404);

    const scope = await resolveReadScope(c, user, row.studentId);
    if (!scope.ok) return scope.response;

    const [projected] = projectReviewable(
      [row],
      viewForActor(user, scope.isOwn),
    );
    if (!projected) return fail(c, "NOT_FOUND", "Certification not found", 404);
    return ok(c, projected);
  })

  .get("/:id/proof", requireCapability(Capability.PROOF_READ), async (c) => {
    const user = getUser(c);
    const id = c.req.param("id");

    const [row] = await db
      .select()
      .from(certificationsTable)
      .where(
        and(
          eq(certificationsTable.id, id),
          isNull(certificationsTable.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return fail(c, "NOT_FOUND", "Certification not found", 404);

    const scope = await resolveReadScope(c, user, row.studentId);
    if (!scope.ok) return scope.response;

    const [projected] = projectReviewable(
      [row],
      viewForActor(user, scope.isOwn),
    );
    if (!projected?.proofKey)
      return fail(c, "NOT_FOUND", "No proof attached", 404);

    return redirectToObject(c, projected.proofKey);
  })

  .patch(
    "/:id",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", updateCertificationSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Certification not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const invalid = await rejectInvalidUpload(
        c,
        "proofKey",
        body.proofKey,
        UploadPurpose.PROOF,
        scope.studentId,
        row.proofKey,
      );
      if (invalid) return invalid;

      const [updated] = await db
        .update(certificationsTable)
        .set({ ...body, ...RESET_TO_PENDING })
        .where(eq(certificationsTable.id, id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.CERTIFICATION,
        entityId: id,
        metadata: diff(row, updated),
      });
      return ok(c, updated);
    },
  )

  .delete(
    "/:id",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwned(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Certification not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [deleted] = await db
        .update(certificationsTable)
        .set({ deletedAt: new Date() })
        .where(eq(certificationsTable.id, id))
        .returning();

      await createAuditLog({
        userId: user.id,
        action: AuditAction.DELETE,
        entity: AuditEntity.CERTIFICATION,
        entityId: id,
      });
      return ok(c, deleted);
    },
  );

export default certifications;
