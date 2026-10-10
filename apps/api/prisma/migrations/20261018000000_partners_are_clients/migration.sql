-- Every partner is now an organisation client, added and edited in Clients
-- ("Show on the home page"), the way a lawyer on the website is a person in
-- Team. Partners added directly under Website -> Our Partners (the sample
-- partners among them) each get an organisation client of the same name, so
-- they show in Clients and can be edited there. These clients have no email
-- or mobile number, so no one can sign in as them.

CREATE TEMP TABLE "_partner_client" AS
SELECT "id" AS "partnerId", gen_random_uuid() AS "clientId", "name", "createdAt"
FROM "Partner"
WHERE "clientId" IS NULL;

INSERT INTO "Client" ("id", "name", "kind", "organisation", "isActive", "createdAt", "updatedAt")
SELECT "clientId", "name", 'ORGANISATION'::"ClientKind", "name", true, "createdAt", now()
FROM "_partner_client";

UPDATE "Partner" AS p
SET "clientId" = pc."clientId", "updatedAt" = now()
FROM "_partner_client" AS pc
WHERE p."id" = pc."partnerId";

ALTER TABLE "Partner" ALTER COLUMN "clientId" SET NOT NULL;

DROP TABLE "_partner_client";
