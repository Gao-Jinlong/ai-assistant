/*
  Warnings:

  - You are about to drop the column `storagePath` on the `Thread` table. All the data in the column will be lost.
  - You are about to drop the column `storageType` on the `Thread` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Thread" DROP COLUMN "storagePath",
DROP COLUMN "storageType";

-- DropEnum
DROP TYPE "StorageType";

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "threadUid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_uid_key" ON "Message"("uid");

-- CreateIndex
CREATE INDEX "Message_threadUid_idx" ON "Message"("threadUid");
