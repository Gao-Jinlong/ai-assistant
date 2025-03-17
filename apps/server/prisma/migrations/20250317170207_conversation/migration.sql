/*
  Warnings:

  - Changed the type of `storageType` on the `Conversation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Conversation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('LOCAL', 'S3');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "storageType",
ADD COLUMN     "storageType" "StorageType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConversationStatus" NOT NULL;
