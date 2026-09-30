import Link from "next/link";
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Target,
  CalendarDays,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { getDashboardData } from "@/services/insights";
import { listProjects, listTags } from "@/services/tasks";
import { listGoals } from "@/services/goals";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { HabitTracker } from "@/components/dashboard/habit-tracker";
import { QuickCapture } from "@/components/dashboard/quick-capture";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const [data, projects, tags, goals] = await Promise.all([
    getDashboardData(db, userId),
    listProjects(db, userId),
    listTags(db, userId),
    listGoals(db, userId),
  ]);

  const focusTasks = [...data.overdueTasks, ...data.todayTasks];

  return (
    <div>
      <PageHeader
        title={`${greeting()}`}
        description={`Here's your day at a glance — ${format(new Date(), "EEEE, MMMM d")}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Due today"
          value={data.counts.dueToday}
          icon={<CalendarClock />}
          hint="tasks due today"
        />
        <Stat
          label="Overdue"
          value={data.counts.overdue}
          icon={<AlertTriangle />}
          hint="needs attention"
        />
        <Stat
          label="Completed"
          value={data.counts.completedThisWeek}
          icon={<CheckCircle2 />}
          hint="tasks this week"
        />
        <Stat
          label="Active goals"
          value={data.counts.activeGoals}
          icon={<Target />}
          hint="in progress"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today&apos;s focus</CardTitle>
                <CardDescription>
                  Overdue and due-today tasks, in one place.
                </CardDescription>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                All tasks
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={focusTasks}
              projects={projects}
              tags={tags}
              goals={goals}
              showAdd
              emptyTitle="Nothing due today"
              emptyDescription="Enjoy the clear schedule — or get ahead on tomorrow."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays
                    className="size-4 text-indigo-600"
                    aria-hidden="true"
                  />
                  Upcoming
                </CardTitle>
              </div>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Calendar
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                No events in the next 7 days.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.upcomingEvents.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex w-11 shrink-0 flex-col items-center rounded-md border border-zinc-200 bg-zinc-50 py-1">
                      <span className="text-[10px] font-semibold uppercase text-zinc-500">
                        {format(event.startAt, "MMM")}
                      </span>
                      <span className="text-sm font-bold text-zinc-900">
                        {format(event.startAt, "d")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {event.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(event.startAt, "EEE, h:mm a")}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HabitTracker habits={data.habits} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Goals</CardTitle>
              <Link
                href="/goals"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                All goals
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.goalProgress.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                No active goals yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {data.goalProgress.map((g) => (
                  <li key={g.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-zinc-800">
                        {g.title}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-zinc-500">
                        {g.progress}%
                      </span>
                    </div>
                    <Progress
                      value={g.progress}
                      label={`${g.title} progress`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuickCapture />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-indigo-600" aria-hidden="true" />
              This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold tracking-tight ${
                  data.finance.net >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.finance.net >= 0 ? "+" : "-"}$
                {Math.abs(data.finance.net).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500">net</span>
            </div>
            <div className="mt-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Income</span>
                <span className="font-medium text-green-600">
                  +${data.finance.income.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Spending</span>
                <span className="font-medium text-red-600">
                  -${data.finance.expenses.toFixed(2)}
                </span>
              </div>
            </div>
            {data.recentTransactions.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-3">
                {data.recentTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge variant="default">{t.category}</Badge>
                      <span className="truncate text-xs text-zinc-500">
                        {format(t.date, "MMM d")}
                      </span>
                    </span>
                    <span
                      className={`font-medium ${
                        t.amount >= 0 ? "text-green-600" : "text-zinc-900"
                      }`}
                    >
                      {t.amount >= 0 ? "+" : "-"}$
                      {Math.abs(t.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
