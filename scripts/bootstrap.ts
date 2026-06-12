import "dotenv/config";
import { db, facultyTable, usersTable } from "@aecfolio/db";
import type { Branch } from "@aecfolio/shared";
import { eq } from "drizzle-orm";

async function promoteUser(
  email: string,
  role: "ADMIN" | "FACULTY",
  faculty?: { employeeId: string; designation: string; department: Branch },
) {
  console.log(`Searching database for: ${email}...`);

  const result = await db
    .update(usersTable)
    .set({ role: role })
    .where(eq(usersTable.email, email))
    .returning({ id: usersTable.id, role: usersTable.role });

  if (result.length === 0) {
    console.error(
      "❌ Error: User not found. Did they log in via Google first?",
    );
    return;
  }

  const user = result[0];

  if (role === "FACULTY" && faculty) {
    await db.insert(facultyTable).values({
      userId: user.id,
      employeeId: faculty.employeeId,
      designation: faculty.designation,
      department: faculty.department,
    });
  }

  console.log(
    `✅ Success! User ${result[0].id} is now promoted to ${result[0].role}.`,
  );
}

async function main() {
  try {
    await promoteUser("admin@example.com", "ADMIN");
    await promoteUser("faculty@example.com", "FACULTY", {
      employeeId: "FAC-CS01",
      designation: "Professor",
      department: "CSE",
    });
  } catch (error) {
    console.error("❌ Database script failure:", error);
    process.exit(1);
  }
}

main();
