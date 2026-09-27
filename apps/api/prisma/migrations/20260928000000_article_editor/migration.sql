-- CreateEnum
CREATE TYPE "ArticleSource" AS ENUM ('MANUAL', 'PIPELINE');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "coverImageId" UUID,
ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "source" "ArticleSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceMeta" JSONB;

-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");

-- AddForeignKey
ALTER TABLE "ArticleImage" ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

