-- Due dates for follow-up, and replace Treasure Hunt with Member.
ALTER TABLE "SoulTracker"
ADD COLUMN "nextContactAt" TIMESTAMP(3);

CREATE INDEX "SoulTracker_branchId_nextContactAt_idx"
ON "SoulTracker"("branchId", "nextContactAt");

UPDATE "SoulTracker" AS st
SET "nextContactAt" = COALESCE(ft."registeredAt", st."createdAt") + INTERVAL '48 hours'
FROM "FirstTimer" AS ft
WHERE st."firstTimerId" = ft.id
  AND ft.status <> 'TREASURE_HUNT'
  AND NOT EXISTS (
    SELECT 1
    FROM "FollowUpActivity" AS a
    WHERE a."soulTrackerId" = st.id
       OR a."firstTimerId" = ft.id
  );

UPDATE "SoulTracker" AS st
SET "nextContactAt" = (
  SELECT MAX(COALESCE(a."contactedAt", a."createdAt")) + INTERVAL '7 days'
  FROM "FollowUpActivity" AS a
  WHERE a."soulTrackerId" = st.id
     OR a."firstTimerId" = st."firstTimerId"
)
FROM "FirstTimer" AS ft
WHERE st."firstTimerId" = ft.id
  AND ft.status <> 'TREASURE_HUNT'
  AND EXISTS (
    SELECT 1
    FROM "FollowUpActivity" AS a
    WHERE a."soulTrackerId" = st.id
       OR a."firstTimerId" = ft.id
  );

UPDATE "SoulTracker" AS st
SET "nextContactAt" = st."createdAt" + INTERVAL '48 hours'
WHERE st."firstTimerId" IS NULL
  AND st."assignedToId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "FollowUpActivity" AS a
    WHERE a."soulTrackerId" = st.id
  );

UPDATE "SoulTracker" AS st
SET "nextContactAt" = (
  SELECT MAX(COALESCE(a."contactedAt", a."createdAt")) + INTERVAL '7 days'
  FROM "FollowUpActivity" AS a
  WHERE a."soulTrackerId" = st.id
)
WHERE st."firstTimerId" IS NULL
  AND st."assignedToId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "FollowUpActivity" AS a
    WHERE a."soulTrackerId" = st.id
  );

CREATE TYPE "FirstTimerStatus_new" AS ENUM (
  'NEW',
  'CONTACTED',
  'VISITED',
  'RETURNED',
  'MEMBER'
);

ALTER TABLE "FirstTimer" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "FirstTimer"
  ALTER COLUMN "status" TYPE "FirstTimerStatus_new"
  USING (
    CASE "status"::text
      WHEN 'TREASURE_HUNT' THEN 'MEMBER'
      ELSE "status"::text
    END
  )::"FirstTimerStatus_new";

DROP TYPE "FirstTimerStatus";
ALTER TYPE "FirstTimerStatus_new" RENAME TO "FirstTimerStatus";

ALTER TABLE "FirstTimer"
  ALTER COLUMN "status" SET DEFAULT 'NEW'::"FirstTimerStatus";
