import { customSectionEntriesTable, customSectionsTable } from "@aecfolio/db";
import {
  Capability,
  createCustomSectionEntrySchema,
  createCustomSectionSchema,
  updateCustomSectionEntrySchema,
  updateCustomSectionSchema,
} from "@aecfolio/shared";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db";
import { resolveOwnStudent, resolveReadScope } from "../lib/ownership";
import { fail, getUser, ok } from "../lib/response";
import { validate } from "../lib/validate";
import { requireAuth, requireCapability } from "../middleware/capability";
import type { AppEnv } from "../types/context";

async function findOwnedSection(id: string, studentId: string) {
  const [row] = await db
    .select()
    .from(customSectionsTable)
    .where(
      and(
        eq(customSectionsTable.id, id),
        isNull(customSectionsTable.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return { row: null, owned: false };
  return { row, owned: row.studentId === studentId };
}

async function findOwnedEntry(
  sectionId: string,
  entryId: string,
  studentId: string,
) {
  const section = await findOwnedSection(sectionId, studentId);
  if (!section.row || !section.owned) return { row: null, owned: false };

  const [row] = await db
    .select()
    .from(customSectionEntriesTable)
    .where(
      and(
        eq(customSectionEntriesTable.id, entryId),
        eq(customSectionEntriesTable.customSectionId, sectionId),
        isNull(customSectionEntriesTable.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return { row: null, owned: false };
  return { row, owned: true };
}

const customSections = new Hono<AppEnv>()
  .get("/", requireAuth(), async (c) => {
    const user = getUser(c);
    const scope = await resolveReadScope(c, user, c.req.query("studentId"));
    if (!scope.ok) return scope.response;

    const rows = await db.query.customSectionsTable.findMany({
      where: (cs, { and, eq, isNull }) =>
        and(eq(cs.studentId, scope.studentId), isNull(cs.deletedAt)),
      with: { entries: { where: (e, { isNull }) => isNull(e.deletedAt) } },
    });

    return ok(c, rows);
  })

  .post(
    "/",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", createCustomSectionSchema),
    async (c) => {
      const user = getUser(c);
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const [section] = await db
        .insert(customSectionsTable)
        .values({ ...body, studentId: scope.studentId })
        .returning();

      return ok(c, section, 201);
    },
  )

  .patch(
    "/:id",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", updateCustomSectionSchema),
    async (c) => {
      const user = getUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwnedSection(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Custom section not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [updated] = await db
        .update(customSectionsTable)
        .set(body)
        .where(eq(customSectionsTable.id, id))
        .returning();

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

      const { row, owned } = await findOwnedSection(id, scope.studentId);
      if (!row) return fail(c, "NOT_FOUND", "Custom section not found", 404);
      if (!owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [deleted] = await db
        .update(customSectionsTable)
        .set({ deletedAt: new Date() })
        .where(eq(customSectionsTable.id, id))
        .returning();

      return ok(c, deleted);
    },
  )

  .post(
    "/:id/entries",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", createCustomSectionEntrySchema),
    async (c) => {
      const user = getUser(c);
      const sectionId = c.req.param("id");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const section = await findOwnedSection(sectionId, scope.studentId);
      if (!section.row)
        return fail(c, "NOT_FOUND", "Custom section not found", 404);
      if (!section.owned) return fail(c, "FORBIDDEN", "Forbidden", 403);

      const [entry] = await db
        .insert(customSectionEntriesTable)
        .values({ ...body, customSectionId: sectionId })
        .returning();

      return ok(c, entry, 201);
    },
  )

  .patch(
    "/:id/entries/:entryId",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    validate("json", updateCustomSectionEntrySchema),
    async (c) => {
      const user = getUser(c);
      const sectionId = c.req.param("id");
      const entryId = c.req.param("entryId");
      const body = c.req.valid("json");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwnedEntry(
        sectionId,
        entryId,
        scope.studentId,
      );
      if (!row || !owned)
        return fail(c, "NOT_FOUND", "Custom section entry not found", 404);

      const [updated] = await db
        .update(customSectionEntriesTable)
        .set(body)
        .where(eq(customSectionEntriesTable.id, entryId))
        .returning();

      return ok(c, updated);
    },
  )

  .delete(
    "/:id/entries/:entryId",
    requireCapability(Capability.PROFILE_WRITE_SELF),
    async (c) => {
      const user = getUser(c);
      const sectionId = c.req.param("id");
      const entryId = c.req.param("entryId");

      const scope = await resolveOwnStudent(c, user);
      if (!scope.ok) return scope.response;

      const { row, owned } = await findOwnedEntry(
        sectionId,
        entryId,
        scope.studentId,
      );
      if (!row || !owned)
        return fail(c, "NOT_FOUND", "Custom section entry not found", 404);

      const [deleted] = await db
        .update(customSectionEntriesTable)
        .set({ deletedAt: new Date() })
        .where(eq(customSectionEntriesTable.id, entryId))
        .returning();

      return ok(c, deleted);
    },
  );

export default customSections;
