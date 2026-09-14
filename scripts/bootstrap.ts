import "dotenv/config";
import { parseArgs } from "node:util";
import { db, usersTable } from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { eq } from "drizzle-orm";

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string", short: "e" },
      name: { type: "string", short: "n" },
      role: { type: "string", short: "r" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const name = values.name?.trim();
  const role = (values.role?.trim().toUpperCase() ?? Role.ADMIN) as Role;

  if (!email || !name) {
    console.error(
      'Usage: pnpm bootstrap --email you@aec.ac.in --name "Your Name" [--role ADMIN]',
    );
    process.exit(1);
  }

  if (!Object.values(Role).includes(role)) {
    console.error(
      `Unknown role "${role}". Expected one of: ${Object.values(Role).join(", ")}`,
    );
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    if (existing.role === role) {
      console.log(`${email} already exists with role ${role}. Nothing to do.`);
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role, deletedAt: null })
      .where(eq(usersTable.id, existing.id))
      .returning({ id: usersTable.id, role: usersTable.role });

    console.log(
      `Updated ${email}: ${existing.role} -> ${updated.role} (${updated.id})`,
    );
    return;
  }

  const [created] = await db
    .insert(usersTable)
    .values({ name, email, emailVerified: true, role })
    .returning({ id: usersTable.id, role: usersTable.role });

  console.log(`Created ${email} as ${created.role} (${created.id}).`);
  console.log("Sign in with Google using that address to claim the account.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  });
