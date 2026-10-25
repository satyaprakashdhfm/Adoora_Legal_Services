import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";

/**
 * BOOTSTRAP_OWNER="email,mobile,name": at start-up, makes sure that person is
 * an active owner who can sign in at /admin/login with Google (the email) or
 * the mobile OTP (the number). Safe to leave set: it only ever creates the
 * account, or puts back its owner access, email and number.
 */
export async function bootstrapOwnerOnStartup() {
  if (!env.BOOTSTRAP_OWNER) return;
  const [rawEmail, rawPhone, ...rest] = env.BOOTSTRAP_OWNER.split(",").map((part) => part.trim());
  const email = rawEmail?.toLowerCase() || null;
  const digits = (rawPhone ?? "").replace(/\D/g, "").slice(-10);
  const phone = digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : null;
  const name = rest.join(",").trim() || "Owner";
  if (!email && !phone) return;

  try {
    const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { role: "OWNER", isActive: true, ...(phone ? { phone } : {}) } })
      : await prisma.user.create({ data: { email, phone, name, role: "OWNER" } });
    logger.info({ userId: user.id }, "Bootstrap owner ready");
  } catch (error) {
    logger.error({ err: error }, "Bootstrap owner failed");
  }
}
