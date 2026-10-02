/**
 * While the firm tries the portals, every sign-in page shows a username and
 * password form (the accounts are in apps/api/src/auth/temp-accounts.ts)
 * instead of "Continue with Google" and the mobile OTP. Set to false to
 * bring those back; their code is unchanged.
 */
export const PASSWORD_ONLY = true;

/**
 * Testing only: each sign-in page lists its test logins, password included,
 * so anyone opening the page can sign in with one tap. These accounts can
 * see everything on the sample case; set to false before real client data
 * goes in (and change the passwords in temp-accounts.ts).
 */
export const SHOW_TEST_LOGINS = true;

export type TestLogin = { name: string; area: "admin" | "lawyer" | "client"; username: string; password: string };

export const TEST_LOGINS: TestLogin[] = [
  { name: "Ganesh", area: "admin", username: "ganesh.admin", password: "4QsDymtPhM" },
  { name: "Pradeep Reddy", area: "admin", username: "pradeep.admin", password: "SSNP6kPVa5" },
  { name: "Surya", area: "admin", username: "surya.admin", password: "9pG5cVQVf4" },
  { name: "Anshu Sharma", area: "admin", username: "anshu.admin", password: "vDQYMMC49Y" },
  { name: "Ganesh", area: "lawyer", username: "ganesh.lawyer", password: "5ZBPSpdD6p" },
  { name: "Pradeep Reddy", area: "lawyer", username: "pradeep.lawyer", password: "WATe2ywdTE" },
  { name: "Surya", area: "lawyer", username: "surya.lawyer", password: "Q7MqQ9yQAF" },
  { name: "Anshu Sharma", area: "lawyer", username: "anshu.lawyer", password: "zHE2Gq5Q88" },
  { name: "Kiran Kumar (demo client)", area: "client", username: "kiran.client", password: "CbER7SSnMG" },
];
