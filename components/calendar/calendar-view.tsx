"use client";

import { useState, useTransition } from "react";
import { format, addMonths, subMonths, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  LayoutGrid,
  Columns3,
  Square,
  Pencil,
  Trash2,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { EventDialog } from "./event-dialog";
import { deleteEventAction } from "@/app/actions/events";
import { fmtMonthYear, toISODate } from "@/lib/dates";
import type { CalendarEvent, TaskDto } from "@/types";

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: TaskDto[];
}

export function CalendarView({ events, tasks }: CalendarViewProps) {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialog, setDialog] = useState<{
    event: CalendarEvent | null;
    initialDate: Date | null;
  } | null>(null);
  const [, startTransition] = useTransition();

  const step = (dir: 1 | -1) => {
    if (view === "month")
      setCursor((c) => (dir === 1 ? addMonths(c, 1) : subMonths(c, 1)));
    else if (view === "week")
      setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  };

  const title =
    view === "month"
      ? fmtMonthYear(cursor)
      : view === "week"
        ? `Week of ${format(cursor, "MMM d")}`
        : format(cursor, "EEEE, MMM d");

  const selectedKey = selectedDate ? toISODate(selectedDate) : null;
  const selectedEvents = selectedKey
    ? events
        .filter((e) => toISODate(e.startsAt) === selectedKey)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    : [];
  const selectedTasks = selectedKey
    ? tasks.filter((t) => t.dueDate && toISODate(t.dueDate) === selectedKey)
    : [];

  const removeEvent = (event: CalendarEvent) =>
    startTransition(async () => {
      if (window.confirm(`Delete event "${event.title}"?`)) {
        await deleteEventAction(event.id);
      }
    });

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Events and task due dates, side by side."
        actions={
          <>
            <Tabs
              tabs={[
                {
                  id: "month",
                  label: "Month",
                  icon: <LayoutGrid className="size-4" aria-hidden="true" />,
                },
                {
                  id: "week",
                  label: "Week",
                  icon: <Columns3 className="size-4" aria-hidden="true" />,
                },
                {
                  id: "day",
                  label: "Day",
                  icon: <Square className="size-4" aria-hidden="true" />,
                },
              ]}
              value={view}
              onChange={setView}
            />
            <Button
              onClick={() =>
                setDialog({ event: null, initialDate: selectedDate ?? cursor })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              New event
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous period"
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next period"
            onClick={() => step(1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
        <div className="w-24" aria-hidden="true" />
      </div>

      {view === "month" && (
        <MonthView
          year={cursor.getFullYear()}
          month={cursor.getMonth()}
          events={events}
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEditEvent={(event) => setDialog({ event, initialDate: null })}
        />
      )}
      {view === "week" && (
        <WeekView
          cursor={cursor}
          events={events}
          tasks={tasks}
          onEditEvent={(event) => setDialog({ event, initialDate: null })}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setCursor(d);
            setView("day");
          }}
        />
      )}
      {view === "day" && (
        <DayView
          date={cursor}
          events={events}
          tasks={tasks}
          onEditEvent={(event) => setDialog({ event, initialDate: null })}
        />
      )}

      {selectedDate && view === "month" && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays
                  className="size-4 text-indigo-600"
                  aria-hidden="true"
                />
                {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDialog({ event: null, initialDate: selectedDate })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEvents.length === 0 && selectedTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                Nothing scheduled this day.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedEvents.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {selectedEvents.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {ev.title}
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            {ev.allDay ? (
                              <Badge variant="success">All day</Badge>
                            ) : (
                              <span>
                                {format(ev.startsAt, "h:mm a")} –{" "}
                                {format(ev.endsAt, "h:mm a")}
                              </span>
                            )}
                            {ev.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" aria-hidden="true" />
                                {ev.location}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Edit event "${ev.title}"`}
                            onClick={() =>
                              setDialog({ event: ev, initialDate: null })
                            }
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-zinc-400 hover:text-red-600"
                            aria-label={`Delete event "${ev.title}"`}
                            onClick={() => removeEvent(ev)}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedTasks.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Tasks due
                    </p>
                    <ul className="flex flex-col gap-1">
                      {selectedTasks.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-2 text-sm text-zinc-800"
                        >
                          <span
                            className="size-2 rounded-full bg-amber-500"
                            aria-hidden="true"
                          />
                          {t.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dialog && (
        <EventDialog
          key={dialog.event?.id ?? `new-${toISODate(dialog.initialDate ?? new Date())}`}
          open
          onClose={() => setDialog(null)}
          event={dialog.event}
          initialDate={dialog.initialDate}
        />
      )}
    </div>
  );
}
