import { z } from "zod";

export const TaskModel = {
  createBody: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    user_id: z.string().optional(),
  }),
  updateBody: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
  }),
  idParam: z.object({
    id: z.string().min(1),
  }),
  taskResponse: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(["todo", "in_progress", "done"]),
    user_id: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  }),
} as const;

export type TaskModel = {
  [K in keyof typeof TaskModel]: z.infer<(typeof TaskModel)[K]>;
};
