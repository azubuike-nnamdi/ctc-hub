-- CreateEnum
CREATE TYPE "FirstTimerCreatedBy" AS ENUM ('SELF', 'STAFF');

-- AlterTable
ALTER TABLE "FirstTimer"
ADD COLUMN "createdBy" "FirstTimerCreatedBy" NOT NULL DEFAULT 'STAFF',
ADD COLUMN "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "FirstTimer_createdByUserId_idx" ON "FirstTimer"("createdByUserId");

-- AddForeignKey
ALTER TABLE "FirstTimer" ADD CONSTRAINT "FirstTimer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
