"use client";

import { useTransition } from "react";
import { format, subDays } from "date-fns";
import { Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { toggleHabitLogAction } from "@/app/actions/habits";
import type { HabitWithLogs } from "@/services/habits";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dates";

const DAYS = 7;

export function HabitTracker({ habits }: { habits: HabitWithLogs[] }) {
  const [isPending, startTransition] = useTransition();

  const days = Array.from({ length: DAYS }, (_, i) =>
    subDays(new Date(), DAYS - 1 - i)
  );

  const toggle = (habitId: string, dateKey: string) =>
    startTransition(async () => {
      await toggleHabitLogAction(habitId, dateKey);
    });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Habits</CardTitle>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <EmptyState
            icon={<Flame />}
            title="No habits yet"
            description="Track small daily wins to build streaks."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {habits.map((habit) => {
              const doneDates = new Set(habit.logs.map((l) => l.date));
              return (
                <li key={habit.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-zinc-800">
                      {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
                        <Flame className="size-3.5" aria-hidden="true" />
                        {habit.streak}
                        <span className="sr-only">day streak</span>
                      </span>
                    )}
                  </div>
                  <div
                    className="grid grid-cols-7 gap-1.5"
                    role="group"
                    aria-label={`${habit.name} — last 7 days`}
                  >
                    {days.map((day) => {
                      const key = toDateKey(day);
                      const done = doneDates.has(key);
                      const isTodayCell = key === toDateKey(new Date());
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isPending}
                          onClick={() => toggle(habit.id, key)}
                          aria-pressed={done}
                          aria-label={`${habit.name} on ${format(day, "MMM d")}: ${
                            done ? "done" : "not done"
                          }`}
                          title={format(day, "EEE, MMM d")}
                          className={cn(
                            "flex aspect-square flex-col items-center justify-center rounded-md border text-[10px] font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50",
                            done
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50",
                            isTodayCell && !done && "ring-1 ring-indigo-300"
                          )}
                        >
                          {format(day, "EEEEE")}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
