/*
  Warnings:

  - Made the column `uid` on table `Assessment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uid` on table `AssessmentType` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uid` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "uid" SET NOT NULL;

-- AlterTable
ALTER TABLE "AssessmentResult" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AssessmentType" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "uid" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "uid" SET NOT NULL;
