import "dotenv/config";
import { parseArgs } from "node:util";
import { db, facultyTable, usersTable } from "@aecfolio/db";
import { Branch, Role } from "@aecfolio/shared";
import { eq } from "drizzle-orm";

const STAFF_ROLES = [Role.FACULTY, Role.MOD, Role.ADMIN] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

function isStaffRole(role: Role): role is StaffRole {
  return (STAFF_ROLES as readonly Role[]).includes(role);
}

const USAGE = [
  'Usage: pnpm bootstrap --email you@aec.ac.in --name "Your Name" \\',
  "         --employee-id E001 [--role ADMIN|MOD|FACULTY] \\",
  '         [--designation "Professor"] [--department CSE]',
  "",
  `Roles: ${STAFF_ROLES.join(", ")} (default ADMIN)`,
  `Departments: ${Object.values(Branch).join(", ")}`,
].join("\n");

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string", short: "e" },
      name: { type: "string", short: "n" },
      role: { type: "string", short: "r" },
      "employee-id": { type: "string", short: "i" },
      designation: { type: "string" },
      department: { type: "string", short: "d" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const name = values.name?.trim();
  const role = (values.role?.trim().toUpperCase() ?? Role.ADMIN) as Role;
  const employeeId = values["employee-id"]?.trim();
  const designation = values.designation?.trim();
  const departmentInput = values.department?.trim().toUpperCase();

  if (!email || !name) {
    console.error(USAGE);
    process.exit(1);
  }

  if (!Object.values(Role).includes(role)) {
    console.error(
      `Unknown role "${role}". Expected one of: ${Object.values(Role).join(", ")}\n\n${USAGE}`,
    );
    process.exit(1);
  }

  if (!isStaffRole(role)) {
    console.error(
      `Bootstrap only creates staff accounts (${STAFF_ROLES.join(", ")}). Students are added through the staff import flow.`,
    );
    process.exit(1);
  }

  if (!employeeId) {
    console.error(`--employee-id is required for role ${role}.\n\n${USAGE}`);
    process.exit(1);
  }

  if (
    departmentInput &&
    !Object.values(Branch).includes(departmentInput as Branch)
  ) {
    console.error(
      `Unknown department "${departmentInput}". Expected one of: ${Object.values(Branch).join(", ")}`,
    );
    process.exit(1);
  }
  const department = departmentInput as Branch | undefined;

  const [existingUser] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  await db.transaction(async (tx) => {
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await tx
        .update(usersTable)
        .set({ role, deletedAt: null })
        .where(eq(usersTable.id, userId));

      if (existingUser.role === role) {
        console.log(`${email} already exists with role ${role}.`);
      } else {
        console.log(`Updated ${email}: ${existingUser.role} -> ${role}`);
      }
    } else {
      const [created] = await tx
        .insert(usersTable)
        .values({ name, email, emailVerified: true, role })
        .returning({ id: usersTable.id });

      userId = created.id;
      console.log(`Created ${email} as ${role} (${userId}).`);
    }

    const [existingFaculty] = await tx
      .select({ id: facultyTable.id })
      .from(facultyTable)
      .where(eq(facultyTable.userId, userId))
      .limit(1);

    const facultyValues = {
      employeeId,
      designation: designation ?? null,
      department: department ?? null,
    };

    if (existingFaculty) {
      await tx
        .update(facultyTable)
        .set({ ...facultyValues, deletedAt: null })
        .where(eq(facultyTable.id, existingFaculty.id));
      console.log(
        `Updated the faculty profile for ${email} (employee ID ${employeeId}).`,
      );
    } else {
      await tx.insert(facultyTable).values({ userId, ...facultyValues });
      console.log(
        `Created a faculty profile for ${email} (employee ID ${employeeId}).`,
      );
    }
  });

  console.log("Sign in with Google using that address to claim the account.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  });
