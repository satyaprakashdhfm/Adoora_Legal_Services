-- CreateEnum
CREATE TYPE "ProfileGroup" AS ENUM ('LEGAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "caseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LawyerProfile" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "group" "ProfileGroup" NOT NULL DEFAULT 'LEGAL',
    "qualification" TEXT,
    "office" TEXT,
    "enrolment" TEXT,
    "stateBar" TEXT,
    "enrolledSince" INTEGER,
    "experience" TEXT,
    "practices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "memberships" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "email" TEXT,
    "summary" TEXT,
    "photo" TEXT,
    "photoData" BYTEA,
    "photoType" TEXT,
    "photoUpdatedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpening" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "practiceArea" TEXT,
    "location" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'Full-time',
    "experience" TEXT,
    "summary" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "closesOn" DATE,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_slug_key" ON "LawyerProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_userId_key" ON "LawyerProfile"("userId");

-- CreateIndex
CREATE INDEX "LawyerProfile_published_sortOrder_idx" ON "LawyerProfile"("published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "JobOpening_slug_key" ON "JobOpening"("slug");

-- CreateIndex
CREATE INDEX "JobOpening_status_sortOrder_idx" ON "JobOpening"("status", "sortOrder");

-- AddForeignKey
ALTER TABLE "LawyerProfile" ADD CONSTRAINT "LawyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

