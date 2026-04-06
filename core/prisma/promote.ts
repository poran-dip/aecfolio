import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not set");

const email = process.env.ADMIN_EMAIL;
if (!email) throw new Error("ADMIN_EMAIL is not set");

const adapter = new PrismaPg({
  connectionString: dbUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: {
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

  console.log(`Promoted ${user.email} to FACULTY`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
