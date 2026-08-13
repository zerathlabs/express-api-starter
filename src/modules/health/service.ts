import type { HealthModel } from "./model.js";

export abstract class HealthService {
	static getStatus(): HealthModel["response"] {
		const memory = process.memoryUsage();
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: Math.floor(process.uptime()),
			memory: {
				heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
				heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
			},
		};
	}
}
