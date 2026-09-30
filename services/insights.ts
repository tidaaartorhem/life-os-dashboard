import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  calendarEvents,
  focusSessions,
  goals,
  habitLogs,
  habits,
  tasks,
  transactions,
} from "@/db/schema";
import {
  addDays,
  dayBounds,
  lastNDays,
  startOfDay,
  startOfMonth,
  toISODate,
  weekRange,
} from "@/lib/dates";
import type { DbClient } from "@/lib/db";
import type { DayProductivity, GoalDto, HabitDto, TaskDto } from "@/types";
import { listGoals } from "./goals";
import { listHabits } from "./habits";
import { listTasks } from "./tasks";

// ---------- Dashboard ----------

export interface DashboardData {
  todayTasks: TaskDto[];
  overdueTasks: TaskDto[];
  upcomingEvents: { id: string; title: string; startsAt: Date; endsAt: Date; location: string | null }[];
  habits: HabitDto[];
  activeGoals: GoalDto[];
  weeklyProductivity: DayProductivity[];
  finance: {
    monthIncome: number;
    monthExpenses: number;
    savingsRate: number;
    topCategories: { category: string; total: number }[];
  };
  counts: {
    dueToday: number;
    overdue: number;
    completedThisWeek: number;
    activeGoals: number;
  };
}

export async function getDashboardData(
  client: DbClient,
  userId: string
): Promise<DashboardData> {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayBounds(now);
  const week = weekRange(now);
  const monthStart = startOfMonth(now);

  const [todayTasks, overdueTasks, upcomingEvents, habits, allGoals, weeklyProductivity, financeRows, completedWeekRows] =
    await Promise.all([
      listTasks(client, userId, {
        statuses: ["todo", "in_progress"],
        dueFrom: todayStart,
        dueTo: todayEnd,
      }),
      listTasks(client, userId, {
        statuses: ["todo", "in_progress"],
        dueTo: new Date(todayStart.getTime() - 1),
      }),
      client.query.calendarEvents.findMany({
        where: and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startsAt, now),
          lte(calendarEvents.startsAt, addDays(now, 7))
        ),
        orderBy: [asc(calendarEvents.startsAt)],
        limit: 8,
        columns: { id: true, title: true, startsAt: true, endsAt: true, location: true },
      }),
      listHabits(client, userId, week.start, week.end),
      listGoals(client, userId),
      getWeeklyProductivity(client, userId),
      client.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          gte(transactions.date, monthStart)
        ),
      }),
      client.query.tasks.findMany({
        where: and(
          eq(tasks.userId, userId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, week.start)
        ),
        columns: { id: true },
      }),
    ]);

  const activeGoals = allGoals
    .filter((g) => g.status === "active")
    .slice(0, 4);

  let monthIncome = 0;
  let monthExpenses = 0;
  const byCategory = new Map<string, number>();
  for (const t of financeRows) {
    if (t.kind === "income") monthIncome += t.amount;
    else {
      monthExpenses += t.amount;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
  }
  const topCategories = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    todayTasks,
    overdueTasks,
    upcomingEvents,
    habits,
    activeGoals,
    weeklyProductivity,
    finance: {
      monthIncome,
      monthExpenses,
      savingsRate:
        monthIncome > 0
          ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)
          : 0,
      topCategories,
    },
    counts: {
      dueToday: todayTasks.length,
      overdue: overdueTasks.length,
      completedThisWeek: completedWeekRows.length,
      activeGoals: allGoals.filter((g) => g.status === "active").length,
    },
  };
}

export async function getWeeklyProductivity(
  client: DbClient,
  userId: string
): Promise<DayProductivity[]> {
  const days = lastNDays(7);
  const from = days[0];
  const [completed, focus] = await Promise.all([
    client.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        eq(tasks.status, "done"),
        gte(tasks.completedAt, from)
      ),
      columns: { completedAt: true },
    }),
    client.query.focusSessions.findMany({
      where: and(eq(focusSessions.userId, userId), gte(focusSessions.date, from)),
      columns: { date: true, minutes: true },
    }),
  ]);

  return days.map((d) => {
    const iso = toISODate(d);
    return {
      date: iso,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      completed: completed.filter(
        (t) => t.completedAt && toISODate(t.completedAt) === iso
      ).length,
      focusMinutes: focus
        .filter((f) => toISODate(f.date) === iso)
        .reduce((sum, f) => sum + f.minutes, 0),
    };
  });
}

// ---------- Analytics ----------

export interface AnalyticsData {
  completionTrend: { date: string; label: string; completed: number; created: number }[];
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; open: number }[];
  habitAdherence: { habit: string; color: string; weeks: { week: string; pct: number }[] }[];
  focusByDay: { date: string; label: string; minutes: number }[];
  spendingByCategory: { category: string; total: number }[];
  completionRate30d: number;
  totalCompleted30d: number;
  avgFocusPerDay: number;
}

export async function getAnalytics(
  client: DbClient,
  userId: string
): Promise<AnalyticsData> {
  const now = new Date();
  const days30 = lastNDays(30);
  const from30 = days30[0];
  const days14 = lastNDays(14);
  const from14 = days14[0];
  const monthStart = startOfMonth(now);

  const [completedRows, createdRows, openRows, focusRows, spendRows, habitRows] =
    await Promise.all([
      client.query.tasks.findMany({
        where: and(
          eq(tasks.userId, userId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, from30)
        ),
        columns: { completedAt: true },
      }),
      client.query.tasks.findMany({
        where: and(eq(tasks.userId, userId), gte(tasks.createdAt, from30)),
        columns: { createdAt: true },
      }),
      client.query.tasks.findMany({
        where: and(eq(tasks.userId, userId), eq(tasks.status, "todo")),
        columns: { status: true, priority: true },
      }).then(async (todo) => {
        const inProg = await client.query.tasks.findMany({
          where: and(eq(tasks.userId, userId), eq(tasks.status, "in_progress")),
          columns: { status: true, priority: true },
        });
        const done = await client.query.tasks.findMany({
          where: and(eq(tasks.userId, userId), eq(tasks.status, "done")),
          columns: { status: true, priority: true },
        });
        return [...todo, ...inProg, ...done];
      }),
      client.query.focusSessions.findMany({
        where: and(eq(focusSessions.userId, userId), gte(focusSessions.date, from14)),
        columns: { date: true, minutes: true },
      }),
      client.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.kind, "expense"),
          gte(transactions.date, monthStart)
        ),
        columns: { category: true, amount: true },
      }),
      client.query.habits.findMany({
        where: eq(habits.userId, userId),
        with: {
          logs: {
            where: gte(habitLogs.date, addDays(startOfDay(now), -28)),
          },
        },
      }),
    ]);

  const completionTrend = days30.map((d) => {
    const iso = toISODate(d);
    return {
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      completed: completedRows.filter(
        (t) => t.completedAt && toISODate(t.completedAt) === iso
      ).length,
      created: createdRows.filter((t) => toISODate(t.createdAt) === iso).length,
    };
  });

  const statusCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();
  for (const t of openRows) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
    if (t.status !== "done") {
      priorityCounts.set(t.priority, (priorityCounts.get(t.priority) ?? 0) + 1);
    }
  }

  const spendByCat = new Map<string, number>();
  for (const s of spendRows) {
    spendByCat.set(s.category, (spendByCat.get(s.category) ?? 0) + s.amount);
  }

  // Habit adherence: last 4 full weeks, % of targetPerWeek hit.
  const habitAdherence = habitRows.map((h) => {
    const weeks: { week: string; pct: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const ref = addDays(startOfDay(now), -w * 7);
      const { start, end } = weekRange(ref);
      const count = h.logs.filter(
        (l) => l.completed && l.date >= start && l.date <= end
      ).length;
      weeks.push({
        week: `W${4 - w}`,
        pct: Math.min(100, Math.round((count / h.targetPerWeek) * 100)),
      });
    }
    return { habit: h.name, color: h.color, weeks };
  });

  const focusByDay = days14.map((d) => {
    const iso = toISODate(d);
    return {
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      minutes: focusRows
        .filter((f) => toISODate(f.date) === iso)
        .reduce((s, f) => s + f.minutes, 0),
    };
  });

  const totalCompleted = completedRows.length;
  const totalCreated = createdRows.length;
  const completionRate30d =
    totalCreated === 0 ? 0 : Math.round((totalCompleted / totalCreated) * 100);

  return {
    completionTrend,
    tasksByStatus: [...statusCounts.entries()].map(([status, count]) => ({
      status,
      count,
    })),
    tasksByPriority: [...priorityCounts.entries()].map(([priority, open]) => ({
      priority,
      open,
    })),
    habitAdherence,
    focusByDay,
    spendingByCategory: [...spendByCat.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
    completionRate30d,
    totalCompleted30d: totalCompleted,
    avgFocusPerDay: Math.round(
      focusByDay.reduce((s, d) => s + d.minutes, 0) / 14
    ),
  };
}

export async function getActiveGoalCount(
  client: DbClient,
  userId: string
): Promise<number> {
  const rows = await client.query.goals.findMany({
    where: and(eq(goals.userId, userId), eq(goals.status, "active")),
    columns: { id: true },
  });
  return rows.length;
}

// Re-export for convenience in actions/pages.
export { listGoals, desc };
