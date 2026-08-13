import { Router } from "express";
import { healthRouter } from "./health/index.js";
import { taskRouter } from "./task/index.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/task", taskRouter);
