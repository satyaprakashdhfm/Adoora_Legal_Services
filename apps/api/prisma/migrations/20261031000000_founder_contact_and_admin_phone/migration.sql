-- The firm's number is now +91 63052 48577 and its LinkedIn link the
-- founder's profile. Saved Site settings hold the old values (the console
-- saves every field), so they are moved over here; the console can change
-- them again afterwards. WhatsApp goes back to following Mobile 1.
UPDATE "SiteSetting"
SET "value" = "value" || jsonb_build_object(
      'mobile1', '+91 63052 48577',
      'whatsapp', '',
      'linkedin', 'https://www.linkedin.com/in/ganesh-raghavendra-57aba8152/'
    ),
    "updatedAt" = NOW()
WHERE "key" = 'contact';

-- Any other field still holding the old number.
UPDATE "SiteSetting"
SET "value" = "value" || jsonb_build_object('mobile2', '+91 63052 48577')
WHERE "key" = 'contact' AND regexp_replace(COALESCE("value"->>'mobile2', ''), '\D', '', 'g') LIKE '%9154825820';

UPDATE "SiteSetting"
SET "value" = "value" || jsonb_build_object('careersPhone', '+91 63052 48577')
WHERE "key" = 'contact' AND regexp_replace(COALESCE("value"->>'careersPhone', ''), '\D', '', 'g') LIKE '%9154825820';

-- The founder's home-page introduction, and his new portrait
-- (public/person-ganesh-raghavendra.jpg) in place of the uploaded one.
UPDATE "LawyerProfile"
SET "summary" = 'Adv. K. L. Ganesh Raghavendra leads the firm''s litigation and advisory practice, advising businesses and individuals on commercial disputes, corporate matters and regulatory questions before courts and tribunals across South India. He founded ADOORA Legal Services on a simple idea: candid advice, careful preparation, and a client who always knows where their case stands.',
    "photo" = 'person-ganesh-raghavendra',
    "photoData" = NULL,
    "photoType" = NULL,
    "photoUpdatedAt" = NULL
WHERE "slug" = 'ganesh-raghavendra';

-- +91 82477 35959 signs in to the console with the mobile OTP, as an owner.
UPDATE "User" SET "role" = 'OWNER', "isActive" = true, "updatedAt" = NOW()
WHERE regexp_replace(COALESCE("phone", ''), '\D', '', 'g') LIKE '%8247735959';

INSERT INTO "User" ("id", "name", "phone", "role", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Admin', '+91 82477 35959', 'OWNER', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE regexp_replace(COALESCE("phone", ''), '\D', '', 'g') LIKE '%8247735959'
);
