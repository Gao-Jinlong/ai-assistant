-- DropIndex
DROP INDEX "User_email_key";

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
