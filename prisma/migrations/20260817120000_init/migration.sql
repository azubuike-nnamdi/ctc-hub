-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PASTOR', 'USHER', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "Chapel" AS ENUM ('ADULT', 'YOUTH', 'JUNIOR');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "FirstTimerStatus" AS ENUM ('NEW', 'CONTACTED', 'VISITED', 'RETURNED', 'TREASURE_HUNT');

-- CreateEnum
CREATE TYPE "SoulStage" AS ENUM ('FIRST_TIMER', 'FOLLOW_UP', 'TREASURE_HUNT', 'MISSION_IGNITION', 'WORKER_TRAINING', 'WORKER', 'LEADER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('CALL', 'VISIT', 'NOTE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "memberSeq" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "chapel" "Chapel" NOT NULL,
    "dateJoined" TIMESTAMP(3) NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirstTimer" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "gender" "Gender" NOT NULL,
    "invitedBy" TEXT,
    "eventId" TEXT,
    "prayerRequest" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,
    "status" "FirstTimerStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirstTimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoulTracker" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "firstTimerId" TEXT,
    "memberId" TEXT,
    "currentStage" "SoulStage" NOT NULL DEFAULT 'FIRST_TIMER',
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoulTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoulStageEvent" (
    "id" TEXT NOT NULL,
    "soulTrackerId" TEXT NOT NULL,
    "stage" "SoulStage" NOT NULL,
    "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "SoulStageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpActivity" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "firstTimerId" TEXT,
    "soulTrackerId" TEXT,
    "type" "FollowUpType" NOT NULL,
    "note" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "capacity" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE INDEX "Branch_organizationId_idx" ON "Branch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "Member_branchId_idx" ON "Member"("branchId");

-- CreateIndex
CREATE INDEX "Member_branchId_status_idx" ON "Member"("branchId", "status");

-- CreateIndex
CREATE INDEX "Member_branchId_chapel_idx" ON "Member"("branchId", "chapel");

-- CreateIndex
CREATE UNIQUE INDEX "Member_branchId_memberCode_key" ON "Member"("branchId", "memberCode");

-- CreateIndex
CREATE INDEX "FirstTimer_branchId_idx" ON "FirstTimer"("branchId");

-- CreateIndex
CREATE INDEX "FirstTimer_branchId_status_idx" ON "FirstTimer"("branchId", "status");

-- CreateIndex
CREATE INDEX "FirstTimer_assignedToId_idx" ON "FirstTimer"("assignedToId");

-- CreateIndex
CREATE INDEX "FirstTimer_eventId_idx" ON "FirstTimer"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SoulTracker_firstTimerId_key" ON "SoulTracker"("firstTimerId");

-- CreateIndex
CREATE UNIQUE INDEX "SoulTracker_memberId_key" ON "SoulTracker"("memberId");

-- CreateIndex
CREATE INDEX "SoulTracker_branchId_idx" ON "SoulTracker"("branchId");

-- CreateIndex
CREATE INDEX "SoulTracker_branchId_currentStage_idx" ON "SoulTracker"("branchId", "currentStage");

-- CreateIndex
CREATE INDEX "SoulStageEvent_soulTrackerId_idx" ON "SoulStageEvent"("soulTrackerId");

-- CreateIndex
CREATE INDEX "FollowUpActivity_branchId_idx" ON "FollowUpActivity"("branchId");

-- CreateIndex
CREATE INDEX "FollowUpActivity_firstTimerId_idx" ON "FollowUpActivity"("firstTimerId");

-- CreateIndex
CREATE INDEX "FollowUpActivity_soulTrackerId_idx" ON "FollowUpActivity"("soulTrackerId");

-- CreateIndex
CREATE INDEX "Event_branchId_idx" ON "Event"("branchId");

-- CreateIndex
CREATE INDEX "Event_branchId_status_idx" ON "Event"("branchId", "status");

-- CreateIndex
CREATE INDEX "Event_branchId_startsAt_idx" ON "Event"("branchId", "startsAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirstTimer" ADD CONSTRAINT "FirstTimer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirstTimer" ADD CONSTRAINT "FirstTimer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirstTimer" ADD CONSTRAINT "FirstTimer_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulTracker" ADD CONSTRAINT "SoulTracker_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulTracker" ADD CONSTRAINT "SoulTracker_firstTimerId_fkey" FOREIGN KEY ("firstTimerId") REFERENCES "FirstTimer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulTracker" ADD CONSTRAINT "SoulTracker_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulTracker" ADD CONSTRAINT "SoulTracker_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoulStageEvent" ADD CONSTRAINT "SoulStageEvent_soulTrackerId_fkey" FOREIGN KEY ("soulTrackerId") REFERENCES "SoulTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_firstTimerId_fkey" FOREIGN KEY ("firstTimerId") REFERENCES "FirstTimer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_soulTrackerId_fkey" FOREIGN KEY ("soulTrackerId") REFERENCES "SoulTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

