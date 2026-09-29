import { prisma } from "../db.js";
import { addSampleData, removeSampleData } from "../demo/sample-data.js";

/**
 * The sample data from the command line (the console's Overview has the same
 * as buttons, for owners):
 *
 *   node dist/scripts/demo-data.js [client-email]   add (also links the first two sample cases to that client)
 *   node dist/scripts/demo-data.js --remove         take it all out
 */
const [arg] = process.argv.slice(2);

(arg === "--remove" ? removeSampleData() : addSampleData(arg && arg.includes("@") ? arg : undefined))
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
