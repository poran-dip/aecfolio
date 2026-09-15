import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import { testBucketName } from "./bucket";
import {
  adminDatabaseUrl,
  databaseNameOf,
  testDatabaseUrl,
} from "./database-url";

const MIGRATIONS = fileURLToPath(
  new URL("../../../../packages/db/drizzle", import.meta.url),
);

async function ensureDatabase(url: string) {
  const name = databaseNameOf(url);
  const client = new Client({ connectionString: adminDatabaseUrl(url) });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      "select 1 from pg_database where datname = $1",
      [name],
    );
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
}

export default async function setup() {
  process.env.S3_BUCKET = testBucketName();
  const { ensureBucket } = await import("../lib/storage");
  await ensureBucket();

  const url = testDatabaseUrl();
  await ensureDatabase(url);

  const pool = new Pool({ connectionString: url });
  try {
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS });
  } finally {
    await pool.end();
  }
}
