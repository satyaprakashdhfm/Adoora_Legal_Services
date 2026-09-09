import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Creates the first owner account so someone can sign in to the admin API.
 *
 * Idempotent: running it again updates the name and role but leaves an
 * existing password alone, so re-seeding never resets a changed password.
 *
 * Usage:
 *   SEED_OWNER_EMAIL=you@firm.com SEED_OWNER_PASSWORD='...' npm run seed
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME ?? "Firm Administrator";

  if (!email || !password) {
    throw new Error(
      "Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD before running the seed.",
    );
  }

  if (password.length < 12) {
    throw new Error("SEED_OWNER_PASSWORD must be at least 12 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, role: "OWNER", isActive: true },
    });
    console.log(`Owner account already existed; refreshed ${email}.`);
    return;
  }

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: "OWNER",
    },
  });

  console.log(`Created owner account for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
