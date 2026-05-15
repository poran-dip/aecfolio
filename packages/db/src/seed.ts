import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  facultyTable,
  resultsTable,
  studentsTable,
  usersTable,
} from "./schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool, { schema });

async function main() {
  // Faculty user
  const [faculty] = await db
    .insert(usersTable)
    .values({
      name: "Dr. Smith",
      email: "smith@aec.ac.in",
      role: "FACULTY",
    })
    .returning();

  await db.insert(facultyTable).values({
    userId: faculty.id,
    employeeId: "FAC002",
    designation: "Professor",
    department: "CSE",
  });

  // Student 1
  const [user1] = await db
    .insert(usersTable)
    .values({
      name: "John Doe",
      email: "john23-001@aec.ac.in",
      role: "STUDENT",
    })
    .returning();

  const [student1] = await db
    .insert(studentsTable)
    .values({
      userId: user1.id,
      rollNo: "220101001",
      course: "BTECH",
      branch: "CSE",
      semester: 6,
      cgpa: 8.75,
      bio: "Passionate software engineer building web apps.",
      skills: [
        "React",
        "Next.js",
        "TypeScript",
        "Python",
        "Tailwind CSS",
        "Data Structures",
      ],
    })
    .returning();

  await db.insert(resultsTable).values([
    {
      studentId: student1.id,
      semester: 1,
      sgpa: 8.5,
      verified: true,
      verifiedBy: faculty.id,
      verifiedAt: new Date(),
    },
    {
      studentId: student1.id,
      semester: 2,
      sgpa: 8.8,
      verified: true,
      verifiedBy: faculty.id,
      verifiedAt: new Date(),
    },
    {
      studentId: student1.id,
      semester: 3,
      sgpa: 8.6,
      verified: true,
      verifiedBy: faculty.id,
      verifiedAt: new Date(),
    },
    {
      studentId: student1.id,
      semester: 4,
      sgpa: 9.0,
      verified: true,
      verifiedBy: faculty.id,
      verifiedAt: new Date(),
    },
    { studentId: student1.id, semester: 5, sgpa: 8.9, verified: false },
  ]);

  // Student 2
  const [user2] = await db
    .insert(usersTable)
    .values({
      name: "Alice Smith",
      email: "alice23-005@aec.ac.in",
      role: "STUDENT",
    })
    .returning();

  await db.insert(studentsTable).values({
    userId: user2.id,
    rollNo: "220101005",
    course: "BTECH",
    branch: "CSE",
    semester: 6,
    cgpa: 9.2,
    skills: [],
  });

  console.log("Seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
