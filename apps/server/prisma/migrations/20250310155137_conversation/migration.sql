-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "title" TEXT,
    "userUid" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessage" TEXT,
    "status" TEXT NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalLatency" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_uid_key" ON "Conversation"("uid");

-- CreateIndex
CREATE INDEX "Conversation_userUid_idx" ON "Conversation"("userUid");
