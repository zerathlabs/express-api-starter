import { Router } from "express";
import { HealthService } from "./service.js";

const router = Router();

router.get("/", (_req, res) => {
	const status = HealthService.getStatus();
	res.status(200).json(status);
});

export const healthRouter = router;
