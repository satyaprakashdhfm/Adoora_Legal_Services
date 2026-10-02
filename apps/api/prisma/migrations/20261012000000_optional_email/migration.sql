-- A client or team member may be added with a mobile number only; they
-- sign in by OTP. An email stays unique when there is one.

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;
