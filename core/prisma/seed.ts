import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Faculty user (acts as admin)
  const faculty = await prisma.user.create({
    data: {
      name: "Dr. Smith",
      email: "smith@aec.ac.in",
      role: "FACULTY",
      faculty: {
        create: {
          employeeId: "FAC001",
          designation: "Professor",
          department: "CSE",
        },
      },
    },
  });

  // Student 1
  const student1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@aec.ac.in",
      role: "STUDENT",
      student: {
        create: {
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
          results: {
            create: [
              {
                semester: 1,
                sgpa: 8.5,
                verified: true,
                verifiedBy: faculty.id,
              },
              {
                semester: 2,
                sgpa: 8.8,
                verified: true,
                verifiedBy: faculty.id,
              },
              {
                semester: 3,
                sgpa: 8.6,
                verified: true,
                verifiedBy: faculty.id,
              },
              {
                semester: 4,
                sgpa: 9.0,
                verified: true,
                verifiedBy: faculty.id,
              },
              { semester: 5, sgpa: 8.9, verified: false },
            ],
          },
        },
      },
    },
  });

  // Student 2
  const student2 = await prisma.user.create({
    data: {
      name: "Alice Smith",
      email: "alice@aec.ac.in",
      role: "STUDENT",
      student: {
        create: {
          rollNo: "220101005",
          course: "BTECH",
          branch: "CSE",
          semester: 6,
          cgpa: 9.2,
          skills: [],
        },
      },
    },
  });

  console.log("Seeded:", { faculty, student1, student2 });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
