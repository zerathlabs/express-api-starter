import type { NextFunction, Request, Response } from "express";
import { env } from "@/env.js";
import { Logger } from "@/utils/logger/index.js";
import { sendError } from "@/utils/response/index.js";

/**
 * Global Express 4-parameter error-handling middleware boundary.
 */
export function errorHandler(
  err: Error & { statusCode?: number; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  Logger.error("[Global Error]", { error: err.message, stack: err.stack });

  const statusCode = err.statusCode || err.status || 500;
  const message =
    env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return sendError(res, message, statusCode);
}
