-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "title" TEXT,
    "userUid" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "status" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "threadUid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_uid_key" ON "Thread"("uid");

-- CreateIndex
CREATE INDEX "Thread_userUid_idx" ON "Thread"("userUid");

-- CreateIndex
CREATE INDEX "Thread_status_idx" ON "Thread"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Message_uid_key" ON "Message"("uid");

-- CreateIndex
CREATE INDEX "Message_threadUid_idx" ON "Message"("threadUid");
