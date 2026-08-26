-- MIP converts on attendance; keep a first-timer row and log the move to member.
ALTER TYPE "FollowUpType" ADD VALUE IF NOT EXISTS 'MEMBERSHIP';
