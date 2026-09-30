"use client";

import { format, isToday } from "date-fns";
import { toISODate } from "@/lib/dates";
import type { CalendarEvent, TaskDto } from "@/types";
import { cn } from "@/lib/utils";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_PX = 56;

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  tasks: TaskDto[];
  onEditEvent: (e: CalendarEvent) => void;
}

export function DayView({ date, events, tasks, onEditEvent }: DayViewProps) {
  const key = toISODate(date);
  const dayEvents = events
    .filter((e) => toISODate(e.startsAt) === key && !e.allDay)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const allDay = events.filter(
    (e) => toISODate(e.startsAt) === key && e.allDay
  );
  const dayTasks = tasks.filter((t) => t.dueDate && toISODate(t.dueDate) === key);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  const blockFor = (ev: CalendarEvent) => {
    const startH =
      ev.startsAt.getHours() + ev.startsAt.getMinutes() / 60;
    const endH = ev.endsAt.getHours() + ev.endsAt.getMinutes() / 60;
    const top = Math.max(0, (startH - START_HOUR) * HOUR_PX);
    const height = Math.max(24, (Math.min(endH, END_HOUR + 1) - Math.max(startH, START_HOUR)) * HOUR_PX);
    return { top, height };
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          {format(date, "EEEE, MMMM d")}
          {isToday(date) && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Today
            </span>
          )}
        </h2>
      </div>

      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-4 py-2">
          {allDay.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEditEvent(ev)}
              className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {dayTasks.length > 0 && (
        <div className="border-b border-zinc-100 px-4 py-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Tasks due
          </p>
          <ul className="flex flex-col gap-1">
            {dayTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 text-sm text-zinc-800"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    t.status === "done" ? "bg-green-500" : "bg-amber-500"
                  )}
                  aria-hidden="true"
                />
                <span className={t.status === "done" ? "line-through text-zinc-400" : ""}>
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative">
        {hours.map((h) => (
          <div
            key={h}
            className="flex border-b border-zinc-100 last:border-b-0"
            style={{ height: HOUR_PX }}
          >
            <div className="w-16 shrink-0 px-2 pt-1 text-right text-[11px] text-zinc-400">
              {format(new Date().setHours(h, 0, 0, 0), "h a")}
            </div>
            <div className="flex-1" />
          </div>
        ))}
        {dayEvents.map((ev) => {
          const { top, height } = blockFor(ev);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEditEvent(ev)}
              style={{ top, height, left: 72, right: 12 }}
              className="absolute overflow-hidden rounded-md border-l-4 border-indigo-500 bg-indigo-100 px-2 py-1 text-left hover:bg-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="block truncate text-xs font-semibold text-indigo-900">
                {ev.title}
              </span>
              <span className="block text-[11px] text-indigo-700">
                {format(ev.startsAt, "h:mm a")} – {format(ev.endsAt, "h:mm a")}
              </span>
              {ev.location && (
                <span className="block truncate text-[11px] text-indigo-600">
                  {ev.location}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
