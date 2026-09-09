import pino from "pino";
import { env, isProduction } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : { target: "pino-pretty", options: { colorize: true } },
  /**
   * Enquiries carry information that may become privileged. Keep it out of
   * the logs entirely rather than relying on redaction at the call site.
   */
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.description",
      "req.body.message",
      "req.body.email",
      "req.body.phone",
      "req.body.name",
      "res.headers['set-cookie']",
    ],
    censor: "[redacted]",
  },
});
