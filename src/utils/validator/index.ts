import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { sendError } from "../response/index.js";

export * from "./schemas.js";

type ValidationSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * Express middleware for validating request body, query, and params using Zod schemas.
 * Automatically parses request properties and returns a 400 Bad Request on validation failure.
 *
 * @example
 * router.post("/", validate({ body: TaskModel.createBody }), (req, res) => { ... });
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(
          req.query,
        )) as typeof req.query;
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(
          req.params,
        )) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Validation Error",
            issues: error.issues,
          },
        });
      }
      return sendError(res, "Validation Error", 400);
    }
  };
}
