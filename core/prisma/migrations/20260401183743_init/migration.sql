-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "skills" TEXT[];
