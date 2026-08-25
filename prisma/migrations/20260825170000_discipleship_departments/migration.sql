-- Replace SoulStage values with the CTC discipleship journey.
CREATE TYPE "SoulStage_new" AS ENUM (
  'FIRST_TIMER',
  'FOLLOW_UP',
  'MIP',
  'SOD',
  'SOM',
  'SOL'
);

ALTER TABLE "SoulTracker" ALTER COLUMN "currentStage" DROP DEFAULT;

ALTER TABLE "SoulTracker"
  ALTER COLUMN "currentStage" TYPE "SoulStage_new"
  USING (
    CASE "currentStage"::text
      WHEN 'FIRST_TIMER' THEN 'FIRST_TIMER'
      WHEN 'FOLLOW_UP' THEN 'FOLLOW_UP'
      WHEN 'TREASURE_HUNT' THEN 'MIP'
      WHEN 'MISSION_IGNITION' THEN 'MIP'
      WHEN 'WORKER_TRAINING' THEN 'SOD'
      WHEN 'WORKER' THEN 'SOM'
      WHEN 'LEADER' THEN 'SOL'
      ELSE 'FOLLOW_UP'
    END
  )::"SoulStage_new";

ALTER TABLE "SoulStageEvent"
  ALTER COLUMN "stage" TYPE "SoulStage_new"
  USING (
    CASE "stage"::text
      WHEN 'FIRST_TIMER' THEN 'FIRST_TIMER'
      WHEN 'FOLLOW_UP' THEN 'FOLLOW_UP'
      WHEN 'TREASURE_HUNT' THEN 'MIP'
      WHEN 'MISSION_IGNITION' THEN 'MIP'
      WHEN 'WORKER_TRAINING' THEN 'SOD'
      WHEN 'WORKER' THEN 'SOM'
      WHEN 'LEADER' THEN 'SOL'
      ELSE 'FOLLOW_UP'
    END
  )::"SoulStage_new";

DROP TYPE "SoulStage";
ALTER TYPE "SoulStage_new" RENAME TO "SoulStage";

ALTER TABLE "SoulTracker"
  ALTER COLUMN "currentStage" SET DEFAULT 'FIRST_TIMER'::"SoulStage";

DELETE FROM "SoulStageEvent" AS later
USING "SoulStageEvent" AS earlier
WHERE later."soulTrackerId" = earlier."soulTrackerId"
  AND later.stage = earlier.stage
  AND later.id <> earlier.id
  AND (
    later."reachedAt" > earlier."reachedAt"
    OR (later."reachedAt" = earlier."reachedAt" AND later.id > earlier.id)
  );

ALTER TABLE "SoulTracker" DROP CONSTRAINT IF EXISTS "SoulTracker_memberId_fkey";
ALTER TABLE "SoulTracker"
  ADD CONSTRAINT "SoulTracker_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SoulTracker" (
  id,
  "branchId",
  "memberId",
  "currentStage",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('cmem', replace(gen_random_uuid()::text, '-', '')),
  m."branchId",
  m.id,
  'FOLLOW_UP'::"SoulStage",
  NOW(),
  NOW()
FROM "Member" m
WHERE NOT EXISTS (
  SELECT 1 FROM "SoulTracker" st WHERE st."memberId" = m.id
);

INSERT INTO "SoulStageEvent" (id, "soulTrackerId", stage, "reachedAt", note)
SELECT
  concat('csev', replace(gen_random_uuid()::text, '-', '')),
  st.id,
  st."currentStage",
  st."createdAt",
  'Member discipleship journey started'
FROM "SoulTracker" st
WHERE st."memberId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "SoulStageEvent" e
    WHERE e."soulTrackerId" = st.id
      AND e.stage = st."currentStage"
  );

CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberDepartment" (
    "memberId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberDepartment_pkey" PRIMARY KEY ("memberId","departmentId")
);

CREATE UNIQUE INDEX "Department_branchId_name_key" ON "Department"("branchId", "name");
CREATE INDEX "Department_branchId_idx" ON "Department"("branchId");
CREATE INDEX "MemberDepartment_departmentId_idx" ON "MemberDepartment"("departmentId");

ALTER TABLE "Department"
  ADD CONSTRAINT "Department_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberDepartment"
  ADD CONSTRAINT "MemberDepartment_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberDepartment"
  ADD CONSTRAINT "MemberDepartment_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
