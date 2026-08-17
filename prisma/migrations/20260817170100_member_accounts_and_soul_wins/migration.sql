-- CreateEnum
CREATE TYPE "SoulWinEventType" AS ENUM ('PERSONAL', 'GROWTHNET', 'WINSOME');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "SoulWin" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "eventType" "SoulWinEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoulWin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "SoulWin_branchId_idx" ON "SoulWin"("branchId");

-- CreateIndex
CREATE INDEX "SoulWin_memberId_idx" ON "SoulWin"("memberId");

-- CreateIndex
CREATE INDEX "SoulWin_memberId_createdAt_idx" ON "SoulWin"("memberId", "createdAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulWin" ADD CONSTRAINT "SoulWin_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulWin" ADD CONSTRAINT "SoulWin_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
