-- Every case has three fixed folders: Internal (firm only), From client and
-- From court (both shared with the client). `section` says which a document,
-- or a folder the firm made, sits in; `visibility` still follows from it
-- (INTERNAL for Internal, CLIENT otherwise) and is what access checks read.

-- CreateEnum
CREATE TYPE "DocumentSection" AS ENUM ('INTERNAL', 'CLIENT', 'COURT');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "section" "DocumentSection" NOT NULL DEFAULT 'CLIENT';
ALTER TABLE "DocumentFolder" ADD COLUMN "section" "DocumentSection" NOT NULL DEFAULT 'CLIENT';

-- Existing files: internal stays internal (the firm-wide folder included),
-- court PDFs go to From court, everything the client could see to From client.
UPDATE "Document" SET "section" = 'INTERNAL' WHERE "visibility" = 'INTERNAL';
UPDATE "Document" SET "section" = 'COURT' WHERE "visibility" = 'CLIENT' AND "fromCourt" = true;
UPDATE "DocumentFolder" SET "section" = 'INTERNAL' WHERE "visibility" = 'INTERNAL';

-- A file in a folder of the other kind follows its folder.
UPDATE "Document" d SET "section" = f."section", "visibility" = f."visibility"
FROM "DocumentFolder" f WHERE d."folderId" = f."id" AND d."section" <> f."section";

-- Folder names are unique within a section now, not a visibility.
DROP INDEX "DocumentFolder_caseId_visibility_name_key";
CREATE UNIQUE INDEX "DocumentFolder_caseId_section_name_key" ON "DocumentFolder"("caseId", "section", "name");
