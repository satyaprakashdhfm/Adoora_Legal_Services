-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'URGENT', 'SHORTLISTED', 'DRAFTED', 'REJECTED');

-- CreateTable
CREATE TABLE "TrendingLead" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "court" TEXT,
    "courtLevel" TEXT NOT NULL DEFAULT 'OTHER',
    "sources" JSONB NOT NULL,
    "outlets" INTEGER NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "practices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "articleId" UUID,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urgentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingLead_key_key" ON "TrendingLead"("key");

-- CreateIndex
CREATE INDEX "TrendingLead_status_score_idx" ON "TrendingLead"("status", "score");

-- CreateIndex
CREATE INDEX "TrendingLead_lastSeenAt_idx" ON "TrendingLead"("lastSeenAt");

