-- CNRs such as TSHC… (Hyderabad City Civil Courts) were read as High Court
-- cases because of the "HC" in them. Put back the district-court level where
-- the court's own name says it is not a High Court.
UPDATE "Case"
SET "courtLevel" = 'DISTRICT_COURT'
WHERE "courtLevel" = 'HIGH_COURT'
  AND "cnrNumber" IS NOT NULL
  AND substring("cnrNumber" from 3 for 2) = 'HC'
  AND left("cnrNumber", 4) NOT IN ('HBHC', 'APHC', 'KAHC', 'DLHC')
  AND "courtName" IS NOT NULL
  AND "courtName" !~* 'high\s*court';
