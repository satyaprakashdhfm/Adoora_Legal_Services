-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);


-- Existing clients were added by the firm or signed in with Google: either
-- way the email is vouched for. Only future mobile sign-ups start unverified.
UPDATE "Client" SET "emailVerifiedAt" = COALESCE("lastLoginAt", "createdAt");
