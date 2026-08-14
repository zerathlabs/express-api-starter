import { sql } from "kysely";
import { db } from "@/db/index.js";
import type {
  ColumnInfo,
  DatabaseSummary,
  PaginatedData,
  TableDetails,
  TableInfo,
} from "./model.js";

export abstract class TableService {
  /**
   * List all user tables in the database with row count estimates and column count.
   */
  static async list(search?: string): Promise<TableInfo[]> {
    let query = sql<{
      name: string;
      schema: string;
      rowCountEstimate: number;
      columnCount: number;
    }>`
      SELECT 
        t.table_name AS "name",
        t.table_schema AS "schema",
        COALESCE(c.col_count, 0)::int AS "columnCount",
        COALESCE(s.n_live_tup, 0)::int AS "rowCountEstimate"
      FROM information_schema.tables t
      LEFT JOIN (
        SELECT table_name, table_schema, COUNT(*)::int AS col_count
        FROM information_schema.columns
        GROUP BY table_name, table_schema
      ) c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      LEFT JOIN pg_stat_user_tables s 
        ON t.table_name = s.relname AND t.table_schema = s.schemaname
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
        AND t.table_type = 'BASE TABLE'
    `;

    if (search) {
      query = sql`${query} AND t.table_name ILIKE ${`%${search}%`}`;
    }

    query = sql`${query} ORDER BY t.table_name ASC`;

    const result = await query.execute(db);
    return result.rows.map((row) => ({
      name: row.name,
      schema: row.schema,
      rowCountEstimate: Number(row.rowCountEstimate),
      columnCount: Number(row.columnCount),
    }));
  }

  /**
   * Get database summary including total table count.
   */
  static async getSummary(): Promise<DatabaseSummary> {
    const tables = await TableService.list();
    const dbNameResult = await sql<{
      current_database: string;
    }>`SELECT current_database()`.execute(db);
    const databaseName = dbNameResult.rows[0]?.current_database ?? "default";

    return {
      databaseName,
      totalTables: tables.length,
      tables,
    };
  }

  /**
   * Get table columns, data types, primary keys, and nullability.
   */
  static async getDetails(tableName: string): Promise<TableDetails | null> {
    const tableExists = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = ${tableName} 
          AND table_schema NOT IN ('information_schema', 'pg_catalog')
      ) AS "exists"
    `.execute(db);

    if (!tableExists.rows[0]?.exists) {
      return null;
    }

    const pkResult = await sql<{ column_name: string }>`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = ${tableName}
    `.execute(db);

    const primaryKeys = pkResult.rows.map((row) => row.column_name);

    const columnsResult = await sql<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position ASC
    `.execute(db);

    const columns: ColumnInfo[] = columnsResult.rows.map((col) => ({
      columnName: col.column_name,
      dataType: col.data_type,
      isNullable: col.is_nullable === "YES",
      columnDefault: col.column_default,
      isPrimaryKey: primaryKeys.includes(col.column_name),
    }));

    return {
      name: tableName,
      columns,
      primaryKeys,
    };
  }

  /**
   * Fetch paginated records from a specific table safely.
   */
  static async getData(
    tableName: string,
    options: {
      page: number;
      limit: number;
      sort_by?: string;
      order: "asc" | "desc";
    },
  ): Promise<PaginatedData | null> {
    const details = await TableService.getDetails(tableName);
    if (!details) {
      return null;
    }

    const { page, limit, sort_by, order } = options;
    const offset = (page - 1) * limit;

    const validColumnNames = details.columns.map((c) => c.columnName);
    const safeSortBy =
      sort_by && validColumnNames.includes(sort_by) ? sort_by : null;

    const countResult = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM ${sql.table(tableName)}
    `.execute(db);

    const total = Number(countResult.rows[0]?.count ?? 0);

    let query = sql`SELECT * FROM ${sql.table(tableName)}`;
    if (safeSortBy) {
      query = sql`${query} ORDER BY ${sql.ref(safeSortBy)} ${sql.raw(order.toUpperCase())}`;
    }
    query = sql`${query} LIMIT ${limit} OFFSET ${offset}`;

    const dataResult = await query.execute(db);

    return {
      data: dataResult.rows as Record<string, unknown>[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
