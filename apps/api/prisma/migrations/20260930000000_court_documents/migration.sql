-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "courtRefreshQueuedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CourtOrder" ADD COLUMN     "documentId" UUID;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fromCourt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "CourtOrder_documentId_key" ON "CourtOrder"("documentId");

-- AddForeignKey
ALTER TABLE "CourtOrder" ADD CONSTRAINT "CourtOrder_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

