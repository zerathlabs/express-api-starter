import { Router } from "express";
import { sendError, sendSuccess } from "@/utils/response/index.js";
import { validate } from "@/utils/validator/index.js";
import { TaskModel } from "./model.js";
import { TaskService } from "./service.js";

const router = Router();

// GET /api/task
router.get("/", async (_req, res) => {
  const tasks = await TaskService.list();
  return sendSuccess(res, tasks);
});

// GET /api/task/:id
router.get(
  "/:id",
  validate({ params: TaskModel.idParam }),
  async (req, res) => {
    const id = req.params.id as string;
    const task = await TaskService.findById(id);
    if (!task) {
      return sendError(res, "Task not found", 404);
    }
    return sendSuccess(res, task);
  },
);

// POST /api/task
router.post("/", validate({ body: TaskModel.createBody }), async (req, res) => {
  const task = await TaskService.create(req.body);
  return sendSuccess(res, task, 201);
});

// PATCH /api/task/:id
router.patch(
  "/:id",
  validate({ params: TaskModel.idParam, body: TaskModel.updateBody }),
  async (req, res) => {
    const id = req.params.id as string;
    const task = await TaskService.update(id, req.body);
    if (!task) {
      return sendError(res, "Task not found", 404);
    }
    return sendSuccess(res, task);
  },
);

// DELETE /api/task/:id
router.delete(
  "/:id",
  validate({ params: TaskModel.idParam }),
  async (req, res) => {
    const id = req.params.id as string;
    const deleted = await TaskService.remove(id);
    if (!deleted) {
      return sendError(res, "Task not found", 404);
    }
    return sendSuccess(res, { deleted: true });
  },
);

export const taskRouter = router;
