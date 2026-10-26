-- The founder's website profile and firm account had been saved as just
-- "Ganesh" (the old test login's name, copied from the Team page). Back to
-- his full name; a name anyone has since changed to something else is kept.
UPDATE "LawyerProfile" SET "name" = 'Adv. K. L. Ganesh Raghavendra'
WHERE "slug" = 'ganesh-raghavendra' AND "name" = 'Ganesh';

UPDATE "User" SET "name" = 'Adv. K. L. Ganesh Raghavendra'
WHERE "email" = 'info@adooralegalservices.com' AND "name" = 'Ganesh';
