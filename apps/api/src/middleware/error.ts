import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http.js";
import { logger } from "../logger.js";
import { isProduction } from "../env.js";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "not_found",
    message: `No route for ${req.method} ${req.path}`,
  });
};

/**
 * Terminal error handler.
 *
 * Validation problems come back with field detail so the form can show it.
 * Everything else returns a generic message in production — an enquiry
 * endpoint should never leak a database error to the browser.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "validation_failed",
      message: "Please check the highlighted fields and try again.",
      issues: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.code ?? "request_failed",
      message: error.message,
    });
    return;
  }

  logger.error({ err: error, path: req.path, method: req.method }, "Unhandled error");

  res.status(500).json({
    error: "internal_error",
    message: isProduction
      ? "Something went wrong on our side. Please try again, or contact us by telephone or email."
      : String(error instanceof Error ? error.stack : error),
  });
};
