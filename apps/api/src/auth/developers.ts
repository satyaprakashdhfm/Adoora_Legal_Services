import { prisma } from "../db.js";
import { logger } from "../logger.js";

/**
 * The people who build and maintain the portal. They always have a team
 * account (Admin and Lawyer) and a client account, so they can open all three
 * areas. They are not part of the firm: the Team and Clients pages and the case
 * pickers never list them, and nobody can edit, deactivate or delete them there.
 * At start-up their accounts are created, or put back if anything changed.
 */
export const DEVELOPERS = [
  { email: "suryaprakashreddy3479@gmail.com", phone: "+91 82477 35959", name: "Surya Prakash Reddy (developer)" },
  { email: "satyaprakashreddy6789@gmail.com", phone: "+91 93815 02998", name: "Satya Prakash Reddy (developer)" },
] as const;

/** Addresses once set up for a developer by mistake: still hidden, and their team accounts removed. */
const RETIRED_EMAILS = ["satyaprakashreddy678@gmail.com"];

const HIDDEN_EMAILS: string[] = [...DEVELOPERS.map((developer) => developer.email), ...RETIRED_EMAILS];

export function isDeveloperEmail(email: string | null | undefined): boolean {
  return Boolean(email && HIDDEN_EMAILS.includes(email.toLowerCase()));
}

/** Matches every team member, or every client, except the developers. */
export const notDeveloper = {
  OR: [{ email: null }, { email: { notIn: HIDDEN_EMAILS, mode: "insensitive" as const } }],
};

const digitsOf = (phone: string | null) => (phone ?? "").replace(/\D/g, "").slice(-10);

/** Removes a team account, with any website profile on it, so nothing is left to show on the Team page. */
async function removeUser(id: string) {
  await prisma.lawyerProfile.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}

export async function ensureDevelopersOnStartup() {
  for (const user of await prisma.user.findMany({ where: { email: { in: RETIRED_EMAILS } }, select: { id: true } })) {
    await removeUser(user.id).catch((error) => logger.error({ err: error }, "Retired developer account not removed"));
  }

  for (const { email, phone, name } of DEVELOPERS) {
    try {
      const digits = digitsOf(phone);
      const holders = (await prisma.user.findMany({
        where: { phone: { not: null }, OR: [{ email: null }, { email: { not: email } }] },
        select: { id: true, email: true, phone: true, lastLoginAt: true },
      })).filter((u) => digitsOf(u.phone) === digits);

      // An account with no email holding the number is this developer's own, made before
      // this list existed: it becomes their account if they have none, and is removed otherwise.
      const strays = holders.filter((u) => !u.email).sort((a, b) => (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0));
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      const adopted = !existing ? strays.shift() : undefined;
      if (adopted) await prisma.user.update({ where: { id: adopted.id }, data: { email, name } });
      for (const stray of strays) await removeUser(stray.id);

      // Anyone else with the number loses it, so OTP sign-in finds only the developer.
      const others = holders.filter((u) => u.email);
      if (others.length) await prisma.user.updateMany({ where: { id: { in: others.map((u) => u.id) } }, data: { phone: null } });
      const clients = (await prisma.client.findMany({
        where: { phone: { not: null }, OR: [{ email: null }, { email: { not: email } }] },
        select: { id: true, phone: true },
      })).filter((c) => digitsOf(c.phone) === digits);
      if (clients.length) await prisma.client.updateMany({ where: { id: { in: clients.map((c) => c.id) } }, data: { phone: null } });

      const now = new Date();
      const account = await prisma.user.upsert({
        where: { email },
        create: { email, phone, name, role: "ADMIN", isLawyer: true },
        update: { phone, role: "ADMIN", isLawyer: true, isActive: true },
      });
      // Not shown on the website, so no profile: one would list them on the Team page.
      await prisma.lawyerProfile.deleteMany({ where: { userId: account.id } });
      await prisma.client.upsert({
        where: { email },
        create: { email, phone, name, emailVerifiedAt: now, phoneVerifiedAt: now },
        update: { phone, isActive: true },
      });
    } catch (error) {
      logger.error({ err: error, email }, "Developer account setup failed");
    }
  }
}
