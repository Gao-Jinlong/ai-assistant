-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "uid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AssessmentResult" ALTER COLUMN "uid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AssessmentType" ALTER COLUMN "uid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "uid" DROP NOT NULL;
