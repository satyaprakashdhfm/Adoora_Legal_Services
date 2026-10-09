-- Team: third-party lawyers (engaged case by case, never sign in) and where
-- each lawyer practises.

-- AlterTable
ALTER TABLE "LawyerProfile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "court" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "thirdParty" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "LawyerProfile_state_district_idx" ON "LawyerProfile"("state", "district");
