-- A document can sit in several of a case's folders at once (say Internal
-- and From court). Each place is the section, or "SECTION/<folder id>".
-- Every existing document keeps the one place it has now.

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "places" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Document" SET "places" = ARRAY[
  CASE WHEN "folderId" IS NULL THEN "section"::TEXT ELSE "section"::TEXT || '/' || "folderId"::TEXT END
];
