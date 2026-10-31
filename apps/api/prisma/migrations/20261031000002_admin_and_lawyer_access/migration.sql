-- Portal access is now two ticks, Admin and Lawyer, and a person can have
-- both. Owner and Editor go: owners become admins, and so do editors (the
-- console is admin-only now). Owners and admins could already use the
-- lawyer dashboard, so they keep the Lawyer tick.
ALTER TABLE "User" ADD COLUMN "isLawyer" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isLawyer" = true WHERE "role" IN ('OWNER', 'ADMIN', 'LAWYER');
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" IN ('OWNER', 'EDITOR');

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LAWYER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'LAWYER';
DROP TYPE "UserRole_old";
