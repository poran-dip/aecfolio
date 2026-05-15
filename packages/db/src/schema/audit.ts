import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt),
    check(
      "auditlog_metadata_shape",
      sql`${t.metadata} IS NULL OR jsonb_typeof(${t.metadata}) = 'object'`,
    ),
  ],
);
