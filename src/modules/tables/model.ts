import { z } from "zod";

// Zod Schemas (Single Source of Truth)
export const TableInfoSchema = z.object({
  name: z.string(),
  schema: z.string(),
  rowCountEstimate: z.number(),
  columnCount: z.number(),
});

export const ColumnInfoSchema = z.object({
  columnName: z.string(),
  dataType: z.string(),
  isNullable: z.boolean(),
  columnDefault: z.string().nullable(),
  isPrimaryKey: z.boolean(),
});

export const TableDetailsSchema = z.object({
  name: z.string(),
  columns: z.array(ColumnInfoSchema),
  primaryKeys: z.array(z.string()),
});

export const DatabaseSummarySchema = z.object({
  databaseName: z.string(),
  totalTables: z.number(),
  tables: z.array(TableInfoSchema),
});

export const TableModel = {
  // Input Validation Schemas
  listQuery: z.object({
    search: z.string().optional(),
    details: z.string().optional(),
  }),
  tableNameParam: z.object({
    name: z.string().min(1),
  }),
  dataQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort_by: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("asc"),
  }),

  // Response Schemas
  tableInfo: TableInfoSchema,
  columnInfo: ColumnInfoSchema,
  tableDetails: TableDetailsSchema,
  databaseSummary: DatabaseSummarySchema,
} as const;

// Inferred TypeScript Types from Zod
export type TableModel = {
  [K in keyof typeof TableModel]: z.infer<(typeof TableModel)[K]>;
};

export type TableInfo = z.infer<typeof TableInfoSchema>;
export type ColumnInfo = z.infer<typeof ColumnInfoSchema>;
export type TableDetails = z.infer<typeof TableDetailsSchema>;
export type DatabaseSummary = z.infer<typeof DatabaseSummarySchema>;

export interface PaginatedData<T = Record<string, unknown>> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
