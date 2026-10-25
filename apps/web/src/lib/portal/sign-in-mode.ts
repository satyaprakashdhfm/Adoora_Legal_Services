/**
 * Staging only (NEXT_PUBLIC_PASSWORD_SIGN_IN=on): every sign-in page shows a
 * username and password form (the accounts are in
 * apps/api/src/auth/temp-accounts.ts, which the API's PASSWORD_SIGN_IN=on
 * enables) instead of "Continue with Google" and the mobile OTP. Off by
 * default, so production offers Google and the OTP.
 */
export const PASSWORD_ONLY = process.env.NEXT_PUBLIC_PASSWORD_SIGN_IN === "on";

/**
 * Staging only, and only with PASSWORD_ONLY: each sign-in page lists its test
 * logins, password included, so anyone opening the page can sign in with one
 * tap. Never on where real client data is.
 */
export const SHOW_TEST_LOGINS = PASSWORD_ONLY && process.env.NEXT_PUBLIC_SHOW_TEST_LOGINS === "on";

export type TestLogin = { name: string; area: "admin" | "lawyer" | "client"; username: string; password: string };

export const TEST_LOGINS: TestLogin[] = [
  { name: "Ganesh", area: "admin", username: "ganesh.admin", password: "4QsDymtPhM" },
  { name: "Pradeep Reddy", area: "admin", username: "pradeep.admin", password: "SSNP6kPVa5" },
  { name: "Anshu Sharma", area: "admin", username: "anshu.admin", password: "vDQYMMC49Y" },
  { name: "Ganesh", area: "lawyer", username: "ganesh.lawyer", password: "5ZBPSpdD6p" },
  { name: "Pradeep Reddy", area: "lawyer", username: "pradeep.lawyer", password: "WATe2ywdTE" },
  { name: "Anshu Sharma", area: "lawyer", username: "anshu.lawyer", password: "zHE2Gq5Q88" },
  { name: "Kiran Kumar (demo client)", area: "client", username: "kiran.client", password: "CbER7SSnMG" },
];
