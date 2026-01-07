-- CreateTable
CREATE TABLE "ThreadMessageBuffer" (
    "id" SERIAL NOT NULL,
    "threadUid" TEXT NOT NULL,
    "messageData" JSONB NOT NULL,
    "messageIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadMessageBuffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreadMessageBuffer_threadUid_idx" ON "ThreadMessageBuffer"("threadUid");

-- CreateIndex
CREATE INDEX "ThreadMessageBuffer_createdAt_idx" ON "ThreadMessageBuffer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadMessageBuffer_threadUid_messageIndex_key" ON "ThreadMessageBuffer"("threadUid", "messageIndex");
