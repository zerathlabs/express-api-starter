import { Router } from "express";
import { env } from "@/env.js";
import { sendError, sendSuccess } from "@/utils/response/index.js";
import { validate } from "@/utils/validator/index.js";
import { TableModel } from "./model.js";
import { TableService } from "./service.js";

const router = Router();

// Guard: Silently pretend the route does not exist in production to prevent endpoint discovery
router.use((_req, res, next) => {
  if (env.NODE_ENV === "production") {
    return sendError(res, "Route not found", 404);
  }
  next();
});

// GET /api/tables/summary - Overall database & tables summary
router.get("/summary", async (_req, res) => {
  const summary = await TableService.getSummary();
  return sendSuccess(res, summary);
});

// GET /api/tables - List user tables (optional ?search= query)
router.get("/", validate({ query: TableModel.listQuery }), async (req, res) => {
  const { search } = req.query as unknown as TableModel["listQuery"];
  const tables = await TableService.list(search);
  return sendSuccess(res, tables);
});

// GET /api/tables/:name - Get table details (columns, types, PKs)
router.get(
  "/:name",
  validate({ params: TableModel.tableNameParam }),
  async (req, res) => {
    const { name } = req.params as TableModel["tableNameParam"];
    const details = await TableService.getDetails(name);
    if (!details) {
      return sendError(res, `Table '${name}' not found`, 404);
    }
    return sendSuccess(res, details);
  },
);

// GET /api/tables/:name/data - Fetch paginated records from a table
router.get(
  "/:name/data",
  validate({ params: TableModel.tableNameParam, query: TableModel.dataQuery }),
  async (req, res) => {
    const { name } = req.params as TableModel["tableNameParam"];
    const query = req.query as unknown as TableModel["dataQuery"];
    const result = await TableService.getData(name, query);
    if (!result) {
      return sendError(res, `Table '${name}' not found`, 404);
    }
    return sendSuccess(res, result);
  },
);

export const tablesRouter = router;
