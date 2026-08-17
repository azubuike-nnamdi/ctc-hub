-- AlterTable
ALTER TABLE "Member" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN "deletedById" TEXT;

-- CreateEnum
CREATE TYPE "SupportTopic" AS ENUM ('ACCOUNT_DELETED', 'SIGN_IN', 'PASSWORD', 'PROFILE', 'OTHER');

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "topic" "SupportTopic" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_isDeleted_idx" ON "Member"("isDeleted");

-- CreateIndex
CREATE INDEX "Member_deletedById_idx" ON "Member"("deletedById");

-- CreateIndex
CREATE INDEX "SupportRequest_email_idx" ON "SupportRequest"("email");

-- CreateIndex
CREATE INDEX "SupportRequest_topic_idx" ON "SupportRequest"("topic");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
