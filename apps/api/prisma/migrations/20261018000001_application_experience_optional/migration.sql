-- The apply form no longer asks for years of experience: the role applied
-- for (Legal Intern, Associate, ...) already says it.
ALTER TABLE "CareerApplication" ALTER COLUMN "experience" DROP NOT NULL;
