"use client";

import { useTransition } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { monthGrid, toISODate } from "@/lib/dates";
import { updateEventAction } from "@/app/actions/events";
import type { CalendarEvent, TaskDto } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  tasks: TaskDto[];
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  onEditEvent: (e: CalendarEvent) => void;
}

function shiftEventToDay(event: CalendarEvent, day: Date) {
  if (event.allDay) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return { startsAt: start, endsAt: end };
  }
  const duration = event.endsAt.getTime() - event.startsAt.getTime();
  const start = new Date(day);
  start.setHours(
    event.startsAt.getHours(),
    event.startsAt.getMinutes(),
    0,
    0
  );
  return { startsAt: start, endsAt: new Date(start.getTime() + duration) };
}

export function MonthView({
  year,
  month,
  events,
  tasks,
  selectedDate,
  onSelectDate,
  onEditEvent,
}: MonthViewProps) {
  const [, startTransition] = useTransition();
  const weeks = monthGrid(year, month);

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = toISODate(e.startsAt);
    const list = byDay.get(key) ?? [];
    list.push(e);
    byDay.set(key, list);
  }
  const tasksByDay = new Map<string, TaskDto[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = toISODate(t.dueDate);
    const list = tasksByDay.get(key) ?? [];
    list.push(t);
    tasksByDay.set(key, list);
  }

  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/calendar-event-id");
    if (!eventId) return;
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;
    const patch = shiftEventToDay(event, day);
    startTransition(async () => {
      await updateEventAction(event.id, patch);
    });
  };

  return (
    <div
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
      role="grid"
      aria-label="Month calendar"
    >
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7" role="row">
          {week.map((day) => {
            const key = toISODate(day);
            const dayEvents = (byDay.get(key) ?? []).sort(
              (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
            );
            const dayTasks = tasksByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, new Date(year, month));
            const selected =
              selectedDate && toISODate(selectedDate) === key;
            const visible = dayEvents.slice(0, 3);
            const hidden = dayEvents.length - visible.length;
            return (
              <div
                key={key}
                role="gridcell"
                aria-label={format(day, "EEEE, MMMM d")}
                onClick={() => onSelectDate(day)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(day, e)}
                className={cn(
                  "min-h-24 cursor-pointer border-b border-r border-zinc-100 p-1.5 transition-colors last:border-r-0 hover:bg-indigo-50/40",
                  !inMonth && "bg-zinc-50/60",
                  selected && "bg-indigo-50/70 ring-1 ring-inset ring-indigo-300"
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day)
                      ? "bg-indigo-600 text-white"
                      : inMonth
                        ? "text-zinc-700"
                        : "text-zinc-400"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex flex-col gap-0.5">
                  {visible.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/calendar-event-id", ev.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(ev);
                      }}
                      title={`${ev.title} — drag to reschedule, click to edit`}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        ev.allDay
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      )}
                    >
                      {!ev.allDay && (
                        <span className="mr-1 font-semibold">
                          {format(ev.startsAt, "h:mm a")}
                        </span>
                      )}
                      {ev.title}
                    </button>
                  ))}
                  {hidden > 0 && (
                    <span className="px-1.5 text-[11px] text-zinc-500">
                      +{hidden} more
                    </span>
                  )}
                  {dayTasks.length > 0 && (
                    <div
                      className="flex items-center gap-1 px-1.5"
                      title={`${dayTasks.length} task(s) due`}
                    >
                      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      <span className="text-[11px] text-zinc-500">
                        {dayTasks.length} due
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
