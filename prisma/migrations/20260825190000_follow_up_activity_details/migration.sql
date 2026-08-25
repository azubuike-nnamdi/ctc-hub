-- Record when follow-up happened and whether a first timer wants to worship again.
ALTER TABLE "FollowUpActivity"
ADD COLUMN "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "wouldWorshipAgain" BOOLEAN;

UPDATE "FollowUpActivity"
SET "contactedAt" = "createdAt"
WHERE "contactedAt" IS DISTINCT FROM "createdAt";
