import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { habitLogs, habits } from "@/db/schema";
import { dayBounds, startOfDay, toISODate, weekRange } from "@/lib/dates";
import type { DbClient } from "@/lib/db";
import type { HabitInput } from "@/lib/validations";
import type { HabitDto } from "@/types";

function streakOf(sortedDates: string[], todayIso: string): number {
  // sortedDates: ascending unique yyyy-MM-dd where habit was completed
  const set = new Set(sortedDates);
  let cursor = todayIso;
  // If today isn't done yet, streak counts back from yesterday.
  if (!set.has(cursor)) {
    const d = new Date(cursor + "T12:00:00");
    d.setDate(d.getDate() - 1);
    cursor = toISODate(d);
  }
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    const d = new Date(cursor + "T12:00:00");
    d.setDate(d.getDate() - 1);
    cursor = toISODate(d);
  }
  return streak;
}

export async function listHabits(
  client: DbClient,
  userId: string,
  from?: Date,
  to?: Date
): Promise<HabitDto[]> {
  const rows = await client.query.habits.findMany({
    where: eq(habits.userId, userId),
    orderBy: [asc(habits.position)],
    with: {
      logs:
        from && to
          ? {
              where: and(gte(habitLogs.date, from), lte(habitLogs.date, to)),
            }
          : true,
    },
  });

  const todayIso = toISODate(new Date());
  const week = weekRange(new Date());

  return rows.map((h) => {
    const logsByDate: Record<string, boolean> = {};
    const doneDates: string[] = [];
    for (const log of h.logs) {
      if (log.completed) {
        const iso = toISODate(log.date);
        logsByDate[iso] = true;
        doneDates.push(iso);
      }
    }
    doneDates.sort();
    const thisWeekCount = doneDates.filter((d) => {
      const dt = new Date(d + "T12:00:00");
      return dt >= week.start && dt <= week.end;
    }).length;
    return {
      ...h,
      logs: h.logs,
      logsByDate,
      completedToday: logsByDate[todayIso] === true,
      streak: streakOf(doneDates, todayIso),
      thisWeekCount,
    };
  });
}

/** Toggle completion for a habit on a given day (defaults to today). */
export async function toggleHabitLog(
  client: DbClient,
  userId: string,
  habitId: string,
  date: Date = new Date()
): Promise<{ completed: boolean }> {
  const habit = await client.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    columns: { id: true },
  });
  if (!habit) throw new Error("Habit not found");

  const day = startOfDay(date);
  const { start, end } = dayBounds(day);
  const existing = await client.query.habitLogs.findFirst({
    where: and(
      eq(habitLogs.habitId, habitId),
      gte(habitLogs.date, start),
      lte(habitLogs.date, end)
    ),
  });
  if (existing) {
    await client.delete(habitLogs).where(eq(habitLogs.id, existing.id));
    return { completed: false };
  }
  await client.insert(habitLogs).values({ habitId, date: day, completed: true });
  return { completed: true };
}

export async function createHabit(
  client: DbClient,
  userId: string,
  input: HabitInput
) {
  const existing = await client.query.habits.findMany({
    where: eq(habits.userId, userId),
    columns: { position: true },
    orderBy: [desc(habits.position)],
    limit: 1,
  });
  const [row] = await client
    .insert(habits)
    .values({
      name: input.name,
      icon: input.icon ?? null,
      color: input.color,
      targetPerWeek: input.targetPerWeek,
      position: (existing[0]?.position ?? 0) + 1024,
      userId,
    })
    .returning();
  return row;
}

export async function updateHabit(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<HabitInput>
) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.icon !== undefined) patch.icon = input.icon ?? null;
  if (input.color !== undefined) patch.color = input.color;
  if (input.targetPerWeek !== undefined) patch.targetPerWeek = input.targetPerWeek;
  await client
    .update(habits)
    .set(patch)
    .where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

export async function deleteHabit(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, userId)));
}
