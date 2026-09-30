"use client";

import { format, isToday } from "date-fns";
import { weekColumns, toISODate } from "@/lib/dates";
import type { CalendarEvent, TaskDto } from "@/types";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  cursor: Date;
  events: CalendarEvent[];
  tasks: TaskDto[];
  onEditEvent: (e: CalendarEvent) => void;
  onSelectDate: (d: Date) => void;
}

export function WeekView({
  cursor,
  events,
  tasks,
  onEditEvent,
  onSelectDate,
}: WeekViewProps) {
  const days = weekColumns(cursor);

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = toISODate(e.startsAt);
    const list = eventsByDay.get(key) ?? [];
    list.push(e);
    eventsByDay.set(key, list);
  }
  const tasksByDay = new Map<string, TaskDto[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = toISODate(t.dueDate);
    const list = tasksByDay.get(key) ?? [];
    list.push(t);
    tasksByDay.set(key, list);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="grid grid-cols-7 divide-x divide-zinc-100">
        {days.map((day) => {
          const key = toISODate(day);
          const dayEvents = (eventsByDay.get(key) ?? []).sort(
            (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
          );
          const dayTasks = tasksByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn("flex min-h-64 flex-col", isToday(day) && "bg-indigo-50/40")}
            >
              <button
                type="button"
                onClick={() => onSelectDate(day)}
                className="border-b border-zinc-100 px-2 py-2 text-center hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday(day) ? "bg-indigo-600 text-white" : "text-zinc-900"
                  )}
                >
                  {format(day, "d")}
                </div>
              </button>
              <div className="flex flex-1 flex-col gap-1 p-1.5">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEditEvent(ev)}
                    className={cn(
                      "rounded px-1.5 py-1 text-left text-[11px] font-medium",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      ev.allDay
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-indigo-100 text-indigo-800"
                    )}
                  >
                    <span className="block truncate">{ev.title}</span>
                    {!ev.allDay && (
                      <span className="block text-[10px] opacity-80">
                        {format(ev.startsAt, "h:mm a")} –{" "}
                        {format(ev.endsAt, "h:mm a")}
                      </span>
                    )}
                  </button>
                ))}
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-1 text-[11px] text-amber-800"
                    title={`Task due: ${t.title}`}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {dayEvents.length === 0 && dayTasks.length === 0 && (
                  <p className="px-1 py-4 text-center text-[11px] text-zinc-400">
                    —
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
