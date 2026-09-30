import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(5000).nullish(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.coerce.date().nullish(),
  projectId: z.string().nullish(),
  goalId: z.string().nullish(),
  milestoneId: z.string().nullish(),
  tagIds: z.array(z.string()).default([]),
  estimatedMinutes: z.coerce.number().int().positive().nullish(),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(5000).nullish(),
  targetDate: z.coerce.date().nullish(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const milestoneSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  targetDate: z.coerce.date().nullish(),
  goalId: z.string().min(1),
});
export type MilestoneInput = z.infer<typeof milestoneSchema>;

export const habitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  icon: z.string().max(10).nullish(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").default("#6366f1"),
  targetPerWeek: z.coerce.number().int().min(1).max(7).default(7),
});
export type HabitInput = z.infer<typeof habitSchema>;

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  allDay: z.boolean().default(false),
});
export type EventInput = z.infer<typeof eventSchema>;

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(20000).default(""),
});
export type NoteInput = z.infer<typeof noteSchema>;

export const transactionSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(200),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().trim().min(1).max(100),
  date: z.coerce.date(),
  kind: z.enum(["income", "expense"]),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#64748b"),
});
export type TagInput = z.infer<typeof tagSchema>;
