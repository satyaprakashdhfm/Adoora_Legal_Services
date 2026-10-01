-- CreateTable
CREATE TABLE "DocGuideUpdate" (
    "key" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocGuideUpdate_pkey" PRIMARY KEY ("key")
);
