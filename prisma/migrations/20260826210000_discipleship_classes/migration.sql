-- Discipleship classes: MIP (2 Sundays) and SOD (8 Sundays).
CREATE TYPE "DiscipleshipProgram" AS ENUM ('MIP', 'SOD');

CREATE TYPE "DiscipleshipClassStatus" AS ENUM (
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "DiscipleshipEnrollmentStatus" AS ENUM (
  'REGISTERED',
  'COMPLETED',
  'DROPPED'
);

CREATE TABLE "DiscipleshipClass" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "program" "DiscipleshipProgram" NOT NULL,
  "title" TEXT NOT NULL,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "status" "DiscipleshipClassStatus" NOT NULL DEFAULT 'OPEN',
  "facilitatorName" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiscipleshipClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscipleshipSession" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "meetsOn" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscipleshipSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscipleshipEnrollment" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "soulTrackerId" TEXT NOT NULL,
  "memberId" TEXT,
  "firstTimerId" TEXT,
  "status" "DiscipleshipEnrollmentStatus" NOT NULL DEFAULT 'REGISTERED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiscipleshipEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscipleshipAttendance" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "present" BOOLEAN NOT NULL DEFAULT true,
  "markedById" TEXT NOT NULL,
  "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscipleshipAttendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscipleshipClass_branchId_idx"
ON "DiscipleshipClass"("branchId");

CREATE INDEX "DiscipleshipClass_branchId_program_status_idx"
ON "DiscipleshipClass"("branchId", "program", "status");

CREATE UNIQUE INDEX "DiscipleshipSession_classId_weekNumber_key"
ON "DiscipleshipSession"("classId", "weekNumber");

CREATE INDEX "DiscipleshipSession_classId_meetsOn_idx"
ON "DiscipleshipSession"("classId", "meetsOn");

CREATE UNIQUE INDEX "DiscipleshipEnrollment_classId_soulTrackerId_key"
ON "DiscipleshipEnrollment"("classId", "soulTrackerId");

CREATE INDEX "DiscipleshipEnrollment_soulTrackerId_idx"
ON "DiscipleshipEnrollment"("soulTrackerId");

CREATE INDEX "DiscipleshipEnrollment_memberId_idx"
ON "DiscipleshipEnrollment"("memberId");

CREATE INDEX "DiscipleshipEnrollment_firstTimerId_idx"
ON "DiscipleshipEnrollment"("firstTimerId");

CREATE UNIQUE INDEX "DiscipleshipAttendance_enrollmentId_sessionId_key"
ON "DiscipleshipAttendance"("enrollmentId", "sessionId");

CREATE INDEX "DiscipleshipAttendance_sessionId_idx"
ON "DiscipleshipAttendance"("sessionId");

ALTER TABLE "DiscipleshipClass"
ADD CONSTRAINT "DiscipleshipClass_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipClass"
ADD CONSTRAINT "DiscipleshipClass_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipSession"
ADD CONSTRAINT "DiscipleshipSession_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "DiscipleshipClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipEnrollment"
ADD CONSTRAINT "DiscipleshipEnrollment_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "DiscipleshipClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipEnrollment"
ADD CONSTRAINT "DiscipleshipEnrollment_soulTrackerId_fkey"
FOREIGN KEY ("soulTrackerId") REFERENCES "SoulTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipEnrollment"
ADD CONSTRAINT "DiscipleshipEnrollment_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipEnrollment"
ADD CONSTRAINT "DiscipleshipEnrollment_firstTimerId_fkey"
FOREIGN KEY ("firstTimerId") REFERENCES "FirstTimer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipAttendance"
ADD CONSTRAINT "DiscipleshipAttendance_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "DiscipleshipEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipAttendance"
ADD CONSTRAINT "DiscipleshipAttendance_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "DiscipleshipSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscipleshipAttendance"
ADD CONSTRAINT "DiscipleshipAttendance_markedById_fkey"
FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
