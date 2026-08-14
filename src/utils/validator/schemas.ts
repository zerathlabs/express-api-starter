import { z } from "zod";

/**
 * Standard ID parameter schema for route params (e.g., /api/task/:id)
 */
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * Standard UUID parameter schema
 */
export const uuidParamSchema = z.object({
  id: z.uuid("Invalid UUID format"),
});

/**
 * Standard query pagination schema (page, limit, sort_by, order)
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Standard search & filter query schema
 */
export const searchQuerySchema = z.object({
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
