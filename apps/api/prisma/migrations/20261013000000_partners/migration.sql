-- The home page's "Our Partners" section: client and partner logos the
-- firm maintains from the console.

-- CreateTable
CREATE TABLE "Partner" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "logoData" BYTEA,
    "logoType" TEXT,
    "logoUpdatedAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "clientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partner_published_sortOrder_idx" ON "Partner"("published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_clientId_key" ON "Partner"("clientId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
