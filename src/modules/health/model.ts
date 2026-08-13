import { z } from "zod";

export const HealthModel = {
	response: z.object({
		status: z.enum(["ok", "error"]),
		timestamp: z.string(),
		uptime: z.number(),
		memory: z.object({
			heapUsedMB: z.number(),
			heapTotalMB: z.number(),
		}),
	}),
} as const;

export type HealthModel = {
	[K in keyof typeof HealthModel]: z.infer<(typeof HealthModel)[K]>;
};
