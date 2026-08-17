-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('BELOW_20', 'RANGE_20_29', 'RANGE_30_39', 'ABOVE_40');

-- CreateEnum
CREATE TYPE "MembershipInterest" AS ENUM ('YES', 'NO', 'INDECISIVE');

-- CreateEnum
CREATE TYPE "HearAboutSource" AS ENUM ('FACEBOOK', 'FAMILY', 'FLYER', 'PREACHING', 'WHATSAPP', 'INSTAGRAM', 'YOUTUBE', 'GOOGLE_SEARCH', 'WEBSITE', 'EMAIL_SMS', 'TV', 'RADIO', 'OTHER');

-- AlterTable
ALTER TABLE "FirstTimer"
ADD COLUMN "occupation" TEXT,
ADD COLUMN "birthday" TEXT,
ADD COLUMN "ageRange" "AgeRange",
ADD COLUMN "membershipInterest" "MembershipInterest",
ADD COLUMN "hearAboutUs" "HearAboutSource"[] NOT NULL DEFAULT ARRAY[]::"HearAboutSource"[],
ADD COLUMN "hearAboutOther" TEXT;
