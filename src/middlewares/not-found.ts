import type { Request, Response } from "express";
import { sendError } from "@/utils/response/index.js";

/**
 * Global Fallback 404 Not Found Middleware Handler.
 */
export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, "Route not found", 404);
}
