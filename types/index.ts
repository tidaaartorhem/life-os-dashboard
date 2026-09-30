import type {
  calendarEvents,
  focusSessions,
  goals,
  habits,
  habitLogs,
  milestones,
  notes,
  projects,
  tags,
  tasks,
  transactions,
} from "@/db/schema";

// ---- Enumerated string unions (stored as TEXT for SQLite/Postgres portability) ----

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const GOAL_STATUSES = ["active", "paused", "completed", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const TRANSACTION_KINDS = ["income", "expense"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

// ---- Row types ----

export type User = { id: string; email: string; name: string; createdAt: Date };
export type Project = typeof projects.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type Note = typeof notes.$inferSelect;

// ---- Rich DTOs used by the UI ----

export interface TaskDto extends Task {
  project: Project | null;
  goal: { id: string; title: string } | null;
  milestone: { id: string; title: string } | null;
  tags: Tag[];
}

export interface MilestoneDto extends Milestone {
  tasks: TaskDto[];
  totalTasks: number;
  doneTasks: number;
  progress: number; // 0..100
}

export interface GoalDto extends Goal {
  milestones: MilestoneDto[];
  tasks: TaskDto[]; // tasks attached directly to the goal
  totalTasks: number;
  doneTasks: number;
  progress: number; // 0..100
}

export interface HabitDto extends Habit {
  logsByDate: Record<string, boolean>; // yyyy-MM-dd -> completed
  completedToday: boolean;
  streak: number;
  thisWeekCount: number;
}

export interface DayProductivity {
  date: string; // yyyy-MM-dd
  label: string; // "Mon"
  completed: number;
  focusMinutes: number;
}
