"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  STATUS_LABEL,
  PRIORITY_LABEL,
} from "@/components/tasks/task-helpers";
import type { AnalyticsData } from "@/services/insights";

const INDIGO = "#4f46e5";
const ZINC = "#d4d4d8";
const ZINC_DARK = "#71717a";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const RED = "#ef4444";

const STATUS_COLORS: Record<string, string> = {
  todo: ZINC_DARK,
  in_progress: AMBER,
  done: GREEN,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: GREEN,
  medium: AMBER,
  high: "#f97316",
  urgent: RED,
};

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">{children}</div>
      </CardContent>
    </Card>
  );
}

export function CompletionTrendChart({
  data,
}: {
  data: AnalyticsData["completionTrend"];
}) {
  return (
    <ChartCard title="Task completion — last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="completed" name="Completed" fill={INDIGO} radius={[3, 3, 0, 0]} />
          <Bar dataKey="created" name="Created" fill={ZINC} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusDonut({ data }: { data: AnalyticsData["tasksByStatus"] }) {
  const rows = data.map((d) => ({
    ...d,
    name: STATUS_LABEL[d.status] ?? d.status,
  }));
  return (
    <ChartCard title="Tasks by status">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            strokeWidth={0}
          >
            {rows.map((r) => (
              <Cell key={r.status} fill={STATUS_COLORS[r.status] ?? INDIGO} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PriorityBars({
  data,
}: {
  data: AnalyticsData["tasksByPriority"];
}) {
  const order = ["urgent", "high", "medium", "low"];
  const rows = order
    .map((p) => data.find((d) => d.priority === p))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({ ...d, name: PRIORITY_LABEL[d.priority] ?? d.priority }));
  return (
    <ChartCard title="Open tasks by priority">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#3f3f46" }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="open" name="Open tasks" radius={[0, 4, 4, 0]}>
            {rows.map((r) => (
              <Cell key={r.priority} fill={PRIORITY_COLORS[r.priority] ?? INDIGO} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FocusChart({ data }: { data: AnalyticsData["focusByDay"] }) {
  return (
    <ChartCard title="Focus minutes — last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="minutes"
            name="Minutes"
            fill={INDIGO}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SpendingChart({
  data,
}: {
  data: AnalyticsData["spendingByCategory"];
}) {
  return (
    <ChartCard title="Spending by category — this month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12, fill: "#3f3f46" }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Spent"]}
          />
          <Bar dataKey="total" name="Spent" fill={INDIGO} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HabitAdherenceCard({
  data,
}: {
  data: AnalyticsData["habitAdherence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit adherence — last 4 weeks</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No habits tracked yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {data.map((h) => (
              <li key={h.habit}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: h.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-zinc-800">
                    {h.habit}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {h.weeks.map((w) => (
                    <div key={w.week} className="flex flex-col gap-1">
                      <div
                        className="h-16 overflow-hidden rounded-md bg-zinc-100"
                        role="img"
                        aria-label={`${h.habit} ${w.week}: ${w.pct}% of weekly target`}
                      >
                        <div
                          className="w-full rounded-md transition-all"
                          style={{
                            height: `${w.pct}%`,
                            marginTop: `${100 - w.pct}%`,
                            backgroundColor: h.color,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <span className="text-center text-[11px] text-zinc-500">
                        {w.week} · {w.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
