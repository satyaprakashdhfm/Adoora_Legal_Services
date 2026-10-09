-- Careers: a résumé travels with each application, and an internship
-- opening is listed all year.

-- AlterTable
ALTER TABLE "CareerApplication" ADD COLUMN     "resumeAuthTag" TEXT,
ADD COLUMN     "resumeDriver" TEXT,
ADD COLUMN     "resumeEncKeyId" TEXT,
ADD COLUMN     "resumeFilename" TEXT,
ADD COLUMN     "resumeIv" TEXT,
ADD COLUMN     "resumeKey" TEXT,
ADD COLUMN     "resumeMimeType" TEXT,
ADD COLUMN     "resumeSize" INTEGER,
ADD COLUMN     "resumeWrapKey" TEXT;

-- The year-round internship: open, no closing date, listed first. It is an
-- ordinary job opening from here on, edited or closed under Website → Jobs.
-- Skipped if the firm already has a role at this address.
INSERT INTO "JobOpening" (
    "id", "slug", "title", "practiceArea", "location", "employmentType", "experience",
    "summary", "responsibilities", "requirements", "status", "closesOn", "publishedAt",
    "sortOrder", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'legal-intern',
    'Legal Intern',
    NULL,
    'Hyderabad, Bengaluru or Guntur',
    'Internship',
    'Law students (3- or 5-year LL.B.)',
    'Internships run throughout the year. Interns work alongside the firm''s lawyers on live matters: legal research, first drafts of notes and pleadings, and attending court and client meetings where appropriate. Tell us your year of study and the months you are available.',
    ARRAY[
        'Research on questions of law and procedure, written up as short notes',
        'First drafts of letters, notices and pleadings, reviewed with you',
        'Attending hearings and client meetings with the team where appropriate'
    ]::TEXT[],
    ARRAY[
        'Enrolled in a 3- or 5-year LL.B. programme',
        'Available for at least four weeks',
        'Careful, clear writing in English'
    ]::TEXT[],
    'OPEN',
    NULL,
    CURRENT_TIMESTAMP,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;
