import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns";
import {
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskStatus,
  type Priority,
} from "@/types";

export function dueInfo(dueDate: Date | null): {
  text: string;
  variant: "danger" | "warning" | "default" | null;
} {
  if (!dueDate) return { text: "", variant: null };
  const day = startOfDay(dueDate);
  const today = startOfDay(new Date());
  if (isToday(day)) return { text: "Today", variant: "warning" };
  if (isTomorrow(day)) return { text: "Tomorrow", variant: "default" };
  if (isPast(day) && day.getTime() !== today.getTime())
    return { text: `Overdue · ${format(day, "MMM d")}`, variant: "danger" };
  return { text: format(day, "MMM d"), variant: "default" };
}

export const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "success"> =
  {
    low: "success",
    medium: "warning",
    high: "danger",
    urgent: "danger",
  };

export const STATUS_VARIANT: Record<string, "default" | "info" | "success"> =
  {
    todo: "default",
    in_progress: "info",
    done: "success",
  };

export const STATUS_LABEL: Record<string, string> = TASK_STATUS_LABELS;
export const PRIORITY_LABEL: Record<string, string> = PRIORITY_LABELS;
