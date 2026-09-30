import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { listEvents } from "@/services/events";
import { listTasks } from "@/services/tasks";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const userId = await getDemoUserId();
  const now = new Date();
  // Fetch a generous window so month/week/day navigation stays client-side.
  const from = startOfMonth(subMonths(now, 3));
  const to = endOfMonth(addMonths(now, 3));

  const [events, tasks] = await Promise.all([
    listEvents(db, userId, from, to),
    listTasks(db, userId, {
      statuses: ["todo", "in_progress"],
      dueFrom: from,
      dueTo: to,
    }),
  ]);

  return <CalendarView events={events} tasks={tasks} />;
}
