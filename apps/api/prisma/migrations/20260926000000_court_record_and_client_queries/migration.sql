-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "courtCheckedAt" TIMESTAMP(3),
ADD COLUMN     "courtStage" TEXT,
ADD COLUMN     "courtStatus" TEXT;

-- CreateTable
CREATE TABLE "CourtSnapshot" (
    "id" UUID NOT NULL,
    "cnr" TEXT NOT NULL,
    "caseId" UUID,
    "source" TEXT NOT NULL DEFAULT 'ecourtsindia',
    "requestId" TEXT,
    "contentHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetchedByUserId" UUID,
    "fetchedByClientId" UUID,

    CONSTRAINT "CourtSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtHearing" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "hearingDate" DATE NOT NULL,
    "purpose" TEXT,
    "judge" TEXT,
    "business" TEXT,
    "nextDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtHearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtOrder" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "orderDate" DATE NOT NULL,
    "orderType" TEXT NOT NULL DEFAULT 'Order',
    "fileName" TEXT NOT NULL DEFAULT '',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientQuery" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "clientId" UUID NOT NULL,
    "caseId" UUID,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "answeredById" UUID,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtSnapshot_cnr_fetchedAt_idx" ON "CourtSnapshot"("cnr", "fetchedAt");

-- CreateIndex
CREATE INDEX "CourtSnapshot_caseId_fetchedAt_idx" ON "CourtSnapshot"("caseId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourtHearing_caseId_hearingDate_key" ON "CourtHearing"("caseId", "hearingDate");

-- CreateIndex
CREATE UNIQUE INDEX "CourtOrder_caseId_orderDate_orderType_fileName_key" ON "CourtOrder"("caseId", "orderDate", "orderType", "fileName");

-- CreateIndex
CREATE UNIQUE INDEX "ClientQuery_reference_key" ON "ClientQuery"("reference");

-- CreateIndex
CREATE INDEX "ClientQuery_status_createdAt_idx" ON "ClientQuery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ClientQuery_clientId_createdAt_idx" ON "ClientQuery"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "CourtSnapshot" ADD CONSTRAINT "CourtSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtSnapshot" ADD CONSTRAINT "CourtSnapshot_fetchedByUserId_fkey" FOREIGN KEY ("fetchedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtSnapshot" ADD CONSTRAINT "CourtSnapshot_fetchedByClientId_fkey" FOREIGN KEY ("fetchedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtHearing" ADD CONSTRAINT "CourtHearing_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtOrder" ADD CONSTRAINT "CourtOrder_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientQuery" ADD CONSTRAINT "ClientQuery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientQuery" ADD CONSTRAINT "ClientQuery_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientQuery" ADD CONSTRAINT "ClientQuery_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

