/**
 * Temporary sign-in while the firm tries the portals: a username and a
 * password for each person, kept here in the code rather than in a new
 * database table, and switched off by setting PASSWORD_SIGN_IN to false.
 * Only bcrypt hashes are stored; the passwords themselves were handed to
 * the firm directly.
 *
 * Each person has one username for the admin console and another for the
 * lawyer workspace. Signing in finds their account by `email` (creating it
 * the first time if it is missing) and puts them on the sample case, so the
 * lawyer workspace and the client portal have the same case to show.
 *
 * The web sign-in pages show a username and password form instead of Google
 * and the mobile OTP while PASSWORD_ONLY is on in
 * apps/web/src/lib/portal/sign-in-mode.ts.
 */

export const PASSWORD_SIGN_IN = true;

/** The sample case everyone is put on. */
export const SHARED_CASE = "ALS-2026-DEMX01";

export type TempAccount = {
  username: string;
  passwordHash: string;
  area: "admin" | "lawyer" | "client";
  name: string;
  /** How the account is found (and created, if missing). */
  email: string;
};

export const TEMP_ACCOUNTS: readonly TempAccount[] = [
  { username: "ganesh.admin", passwordHash: "$2b$10$rxZYANICiHH20Wu1kJf8cehZ767n3AAewdBEiffeFeUNfSTUDXxsq", area: "admin", name: "Ganesh", email: "info@adooralegalservices.com" },
  { username: "ganesh.lawyer", passwordHash: "$2b$10$amqMFYpv5/ZAAJ0bgOUHKegEF9Q4eHCEZSTZhH8LXDe0wa6k8RQVe", area: "lawyer", name: "Ganesh", email: "info@adooralegalservices.com" },
  { username: "pradeep.admin", passwordHash: "$2b$10$pECbiBMuST4Xo4qcjWKG6u4zf9zafzYaK3UYO3C2zVwK0OF8pgoK6", area: "admin", name: "Pradeep Reddy", email: "pradeep.test@adoora.invalid" },
  { username: "pradeep.lawyer", passwordHash: "$2b$10$5yjlNI6uEwEaVTmHBUGL8.6Jtjy9PDzxXVrqYwYuOR3ckY4XwwKVC", area: "lawyer", name: "Pradeep Reddy", email: "pradeep.test@adoora.invalid" },
  { username: "surya.admin", passwordHash: "$2b$10$V3j8R8qF60eeN3yEA8xQyOCF7vcApaKc9qvLuZ0BTq1Ujh1cUeSO2", area: "admin", name: "Surya", email: "surya.test@adoora.invalid" },
  { username: "surya.lawyer", passwordHash: "$2b$10$P.mtYD99bUePKo2/5h8R/ON9fINDVAyKc05sZzn6jebRLqhAgQxVW", area: "lawyer", name: "Surya", email: "surya.test@adoora.invalid" },
  { username: "kiran.client", passwordHash: "$2b$10$N1MqMvOS9fBQ/1MbYiZNJ.l7F6OmzwOkOkkH0zKPtC.NwWB.KydtG", area: "client", name: "Kiran Kumar (Demo client)", email: "kiran.client@adoora.invalid" },
];
