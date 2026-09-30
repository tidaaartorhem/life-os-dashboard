import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns";

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
    high: "danger",
    medium: "warning",
    low: "success",
  };

export const STATUS_VARIANT: Record<string, "default" | "info" | "success"> = {
  todo: "default",
  "in-progress": "info",
  done: "success",
};

export const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};
