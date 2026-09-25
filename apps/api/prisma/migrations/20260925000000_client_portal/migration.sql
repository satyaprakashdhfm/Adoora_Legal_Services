-- CreateEnum
CREATE TYPE "ClientKind" AS ENUM ('INDIVIDUAL', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('INTAKE', 'ACTIVE', 'ON_HOLD', 'DISPOSED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('PRE_FILING', 'FILED', 'UNDER_SCRUTINY', 'DEFECTS_NOTIFIED', 'REGISTERED', 'ADMISSION', 'NOTICE_ISSUED', 'PLEADINGS', 'EVIDENCE', 'ARGUMENTS', 'RESERVED_FOR_ORDERS', 'DISPOSED');

-- CreateEnum
CREATE TYPE "CourtLevel" AS ENUM ('SUPREME_COURT', 'HIGH_COURT', 'DISTRICT_COURT', 'SUBORDINATE_COURT', 'FAMILY_COURT', 'COMMERCIAL_COURT', 'TRIBUNAL', 'CONSUMER_COMMISSION', 'ARBITRATION', 'QUASI_JUDICIAL', 'NOT_IN_LITIGATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('PETITIONER', 'RESPONDENT', 'APPELLANT', 'APPLICANT', 'PLAINTIFF', 'DEFENDANT', 'COMPLAINANT', 'ACCUSED', 'OPPOSITE_PARTY', 'INTERVENOR', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('LEAD', 'ASSOCIATE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UpdateKind" AS ENUM ('NOTE', 'HEARING', 'ORDER', 'FILING', 'STATUS_CHANGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('CLIENT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PETITION', 'PLEADING', 'AFFIDAVIT', 'VAKALATNAMA', 'EVIDENCE', 'ORDER', 'JUDGMENT', 'NOTICE', 'CORRESPONDENCE', 'AGREEMENT', 'IDENTITY', 'FINANCIAL', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LAWYER';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorClientId" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "barEnrolment" TEXT,
ADD COLUMN     "googleSub" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ClientKind" NOT NULL DEFAULT 'INDIVIDUAL',
    "organisation" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "googleSub" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID,
    "clientId" UUID,
    "method" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "practiceArea" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'INTAKE',
    "stage" "CaseStage" NOT NULL DEFAULT 'PRE_FILING',
    "courtLevel" "CourtLevel" NOT NULL DEFAULT 'NOT_IN_LITIGATION',
    "courtName" TEXT,
    "bench" TEXT,
    "state" TEXT,
    "district" TEXT,
    "courtHall" TEXT,
    "coram" TEXT,
    "caseTypeCode" TEXT,
    "caseTypeName" TEXT,
    "caseNumber" TEXT,
    "caseYear" INTEGER,
    "filingNumber" TEXT,
    "filingDate" DATE,
    "registrationDate" DATE,
    "cnrNumber" TEXT,
    "actsAndSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reliefSought" TEXT,
    "originCourt" TEXT,
    "originCaseNumber" TEXT,
    "impugnedOrderDate" DATE,
    "lastHearingDate" DATE,
    "nextHearingDate" DATE,
    "nextHearingPurpose" TEXT,
    "disposalDate" DATE,
    "disposalNature" TEXT,
    "documentSeq" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdByClientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseParty" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "role" "PartyRole" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "isClient" BOOLEAN NOT NULL DEFAULT false,
    "counsel" TEXT,

    CONSTRAINT "CaseParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseClient" (
    "caseId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseClient_pkey" PRIMARY KEY ("caseId","clientId")
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "caseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "AssignmentRole" NOT NULL DEFAULT 'ASSOCIATE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("caseId","userId")
);

-- CreateTable
CREATE TABLE "CaseUpdate" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "kind" "UpdateKind" NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "eventDate" DATE,
    "visibility" "Visibility" NOT NULL DEFAULT 'CLIENT',
    "authorUserId" UUID,
    "authorClientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "caseId" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'CLIENT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "uploadedByUserId" UUID,
    "uploadedByClientId" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageDriver" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "encKeyId" TEXT NOT NULL,
    "wrappedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "uploadedByUserId" UUID,
    "uploadedByClientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_googleSub_key" ON "Client"("googleSub");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_clientId_idx" ON "Session"("clientId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Case_reference_key" ON "Case"("reference");

-- CreateIndex
CREATE INDEX "Case_status_updatedAt_idx" ON "Case"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Case_courtLevel_idx" ON "Case"("courtLevel");

-- CreateIndex
CREATE INDEX "Case_nextHearingDate_idx" ON "Case"("nextHearingDate");

-- CreateIndex
CREATE INDEX "Case_cnrNumber_idx" ON "Case"("cnrNumber");

-- CreateIndex
CREATE INDEX "CaseParty_caseId_idx" ON "CaseParty"("caseId");

-- CreateIndex
CREATE INDEX "CaseClient_clientId_idx" ON "CaseClient"("clientId");

-- CreateIndex
CREATE INDEX "CaseAssignment_userId_idx" ON "CaseAssignment"("userId");

-- CreateIndex
CREATE INDEX "CaseUpdate_caseId_createdAt_idx" ON "CaseUpdate"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_reference_key" ON "Document"("reference");

-- CreateIndex
CREATE INDEX "Document_caseId_deletedAt_idx" ON "Document"("caseId", "deletedAt");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_caseId_seq_key" ON "Document"("caseId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_storageKey_key" ON "DocumentVersion"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "AuditLog_actorClientId_createdAt_idx" ON "AuditLog"("actorClientId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorClientId_fkey" FOREIGN KEY ("actorClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdByClientId_fkey" FOREIGN KEY ("createdByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClient" ADD CONSTRAINT "CaseClient_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseClient" ADD CONSTRAINT "CaseClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_authorClientId_fkey" FOREIGN KEY ("authorClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByClientId_fkey" FOREIGN KEY ("uploadedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedByClientId_fkey" FOREIGN KEY ("uploadedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

