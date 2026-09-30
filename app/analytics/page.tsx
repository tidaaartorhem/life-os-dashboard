import { Target, CheckCircle2, Timer, Flame } from "lucide-react";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { getAnalytics } from "@/services/insights";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import {
  CompletionTrendChart,
  StatusDonut,
  PriorityBars,
  FocusChart,
  SpendingChart,
  HabitAdherenceCard,
} from "@/components/analytics/charts";

export default async function AnalyticsPage() {
  const userId = await getDemoUserId();
  const data = await getAnalytics(db, userId);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="How you're spending your time, money, and attention."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Completion rate"
          value={`${data.completionRate30d}%`}
          icon={<Target />}
          hint="last 30 days"
        />
        <Stat
          label="Tasks completed"
          value={data.totalCompleted30d}
          icon={<CheckCircle2 />}
          hint="last 30 days"
        />
        <Stat
          label="Avg. focus"
          value={`${data.avgFocusPerDay}m`}
          icon={<Timer />}
          hint="per day, last 14 days"
        />
        <Stat
          label="Habits tracked"
          value={data.habitAdherence.length}
          icon={<Flame />}
          hint="with 4-week history"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CompletionTrendChart data={data.completionTrend} />
        <FocusChart data={data.focusByDay} />
        <StatusDonut data={data.tasksByStatus} />
        <PriorityBars data={data.tasksByPriority} />
        <SpendingChart data={data.spendingByCategory} />
        <HabitAdherenceCard data={data.habitAdherence} />
      </div>
    </div>
  );
}
