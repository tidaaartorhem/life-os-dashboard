import { eq } from "drizzle-orm";
import {
  calendarEvents,
  focusSessions,
  goals,
  habitLogs,
  habits,
  milestones,
  notes,
  projects,
  tags,
  tasks,
  taskTags,
  transactions,
  users,
} from "./schema";
import { db } from "../lib/db";
import { addDays, startOfDay } from "date-fns";

const DAY = 86400000;
const at = (base: Date, daysOffset: number, h = 9, m = 0) => {
  const d = addDays(base, daysOffset);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@lifeos.app";
  const today = startOfDay(new Date());

  // Idempotent: wipe the demo user's data and rebuild.
  await db.delete(users).where(eq(users.email, email));

  const [user] = await db
    .insert(users)
    .values({ email, name: "Alex Morgan" })
    .returning();
  const uid = user.id;

  // ---- Projects & tags ----
  const projectRows = await db
    .insert(projects)
    .values([
      { name: "Work", color: "#6366f1", userId: uid },
      { name: "Personal", color: "#10b981", userId: uid },
      { name: "Health", color: "#f59e0b", userId: uid },
      { name: "Side Project", color: "#8b5cf6", userId: uid },
    ])
    .returning();
  const P = Object.fromEntries(projectRows.map((p) => [p.name, p.id]));

  const tagRows = await db
    .insert(tags)
    .values([
      { name: "deep-work", color: "#6366f1", userId: uid },
      { name: "admin", color: "#64748b", userId: uid },
      { name: "health", color: "#10b981", userId: uid },
      { name: "finance", color: "#f59e0b", userId: uid },
      { name: "learning", color: "#0ea5e9", userId: uid },
    ])
    .returning();
  const T = Object.fromEntries(tagRows.map((t) => [t.name, t.id]));

  // ---- Goals + milestones ----
  const [g1] = await db
    .insert(goals)
    .values({
      title: "Run a 10K race",
      description: "Build from couch to a sub-60 minute 10K.",
      targetDate: addDays(today, 84),
      status: "active",
      userId: uid,
    })
    .returning();
  const [g2] = await db
    .insert(goals)
    .values({
      title: "Ship the Life OS Dashboard",
      description: "Design, build and launch a personal operating system.",
      targetDate: addDays(today, 21),
      status: "active",
      userId: uid,
    })
    .returning();
  const [g3] = await db
    .insert(goals)
    .values({
      title: "Read 24 books this year",
      description: "Two books a month, mostly non-fiction.",
      targetDate: new Date(today.getFullYear(), 11, 31),
      status: "active",
      userId: uid,
    })
    .returning();

  const msRows = await db
    .insert(milestones)
    .values([
      { title: "Base building — 4 weeks easy miles", targetDate: addDays(today, 28), goalId: g1.id, position: 1024 },
      { title: "Speed work — intervals & tempo", targetDate: addDays(today, 56), goalId: g1.id, position: 2048 },
      { title: "Race week", targetDate: addDays(today, 84), goalId: g1.id, position: 3072 },
      { title: "MVP — dashboard, tasks, goals", targetDate: addDays(today, 7), goalId: g2.id, position: 1024 },
      { title: "Polish — calendar, analytics, mobile", targetDate: addDays(today, 14), goalId: g2.id, position: 2048 },
      { title: "Launch — deploy & share", targetDate: addDays(today, 21), goalId: g2.id, position: 3072 },
      { title: "Q1–Q2 — 12 books", targetDate: addDays(today, 30), goalId: g3.id, position: 1024 },
      { title: "Q3–Q4 — 12 books", targetDate: addDays(today, 120), goalId: g3.id, position: 2048 },
    ])
    .returning();
  const M = Object.fromEntries(msRows.map((m) => [m.title, m.id]));

  // ---- Tasks ----
  type TSeed = {
    title: string;
    status?: string;
    priority?: string;
    due?: Date | null;
    project?: string;
    tagNames?: string[];
    goalId?: string;
    milestone?: string;
    doneDaysAgo?: number;
  };
  const taskSeeds: TSeed[] = [
    // Today
    { title: "Review Q3 roadmap draft", status: "todo", priority: "high", due: at(today, 0, 17), project: "Work", tagNames: ["deep-work"] },
    { title: "30-minute easy run", status: "todo", priority: "medium", due: at(today, 0, 18, 30), project: "Health", tagNames: ["health"], goalId: g1.id, milestone: "Base building — 4 weeks easy miles" },
    { title: "Pay electricity bill", status: "todo", priority: "medium", due: at(today, 0, 20), project: "Personal", tagNames: ["admin", "finance"] },
    // Overdue
    { title: "File expense report", status: "todo", priority: "urgent", due: at(today, -2, 12), project: "Work", tagNames: ["admin", "finance"] },
    { title: "Book dentist appointment", status: "todo", priority: "low", due: at(today, -1, 10), project: "Personal", tagNames: ["admin"] },
    // This week
    { title: "Design system: buttons & inputs", status: "in_progress", priority: "high", due: at(today, 1, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "MVP — dashboard, tasks, goals" },
    { title: "Kanban drag & drop", status: "in_progress", priority: "high", due: at(today, 2, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "MVP — dashboard, tasks, goals" },
    { title: "Tempo run — 6 x 800m", status: "todo", priority: "medium", due: at(today, 2, 7), project: "Health", tagNames: ["health"], goalId: g1.id, milestone: "Speed work — intervals & tempo" },
    { title: "Prepare sprint demo", status: "todo", priority: "high", due: at(today, 3, 15), project: "Work", tagNames: ["deep-work"] },
    { title: "Grocery run", status: "todo", priority: "low", due: at(today, 4, 11), project: "Personal", tagNames: ["admin"] },
    { title: "Read: Thinking, Fast and Slow (ch. 4–6)", status: "todo", priority: "low", due: at(today, 5, 21), project: "Personal", tagNames: ["learning"], goalId: g3.id, milestone: "Q1–Q2 — 12 books" },
    // Done recently
    { title: "Set up project repo & CI", status: "done", priority: "high", due: at(today, -6, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "MVP — dashboard, tasks, goals", doneDaysAgo: 6 },
    { title: "Write database schema", status: "done", priority: "high", due: at(today, -5, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "MVP — dashboard, tasks, goals", doneDaysAgo: 5 },
    { title: "Long run — 12K", status: "done", priority: "medium", due: at(today, -4, 8), project: "Health", tagNames: ["health"], goalId: g1.id, milestone: "Base building — 4 weeks easy miles", doneDaysAgo: 4 },
    { title: "1:1 with manager", status: "done", priority: "medium", due: at(today, -3, 14), project: "Work", tagNames: ["admin"], doneDaysAgo: 3 },
    { title: "Finish: The Design of Everyday Things", status: "done", priority: "low", due: at(today, -2, 21), project: "Personal", tagNames: ["learning"], goalId: g3.id, milestone: "Q1–Q2 — 12 books", doneDaysAgo: 2 },
    { title: "Interval session — 8 x 400m", status: "done", priority: "medium", due: at(today, -1, 7), project: "Health", tagNames: ["health"], goalId: g1.id, milestone: "Base building — 4 weeks easy miles", doneDaysAgo: 1 },
    // Backlog
    { title: "Research standing desks", status: "todo", priority: "low", project: "Personal", tagNames: ["admin"] },
    { title: "Plan Japan trip itinerary", status: "todo", priority: "medium", due: at(today, 30, 12), project: "Personal" },
    { title: "Refactor auth middleware", status: "todo", priority: "medium", project: "Work", tagNames: ["deep-work"] },
    { title: "Write launch blog post", status: "todo", priority: "medium", due: at(today, 18, 12), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "Launch — deploy & share" },
    { title: "Deploy to production", status: "todo", priority: "high", due: at(today, 20, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "Launch — deploy & share" },
    { title: "Calendar month view", status: "todo", priority: "high", due: at(today, 9, 17), project: "Side Project", tagNames: ["deep-work"], goalId: g2.id, milestone: "Polish — calendar, analytics, mobile" },
  ];

  let pos = 0;
  for (const s of taskSeeds) {
    pos += 1024;
    const completedAt =
      s.status === "done" ? at(today, -(s.doneDaysAgo ?? 1), 16) : null;
    const [t] = await db
      .insert(tasks)
      .values({
        title: s.title,
        status: s.status ?? "todo",
        priority: s.priority ?? "medium",
        dueDate: s.due ?? null,
        position: pos,
        completedAt,
        userId: uid,
        projectId: s.project ? P[s.project] : null,
        goalId: s.goalId ?? null,
        milestoneId: s.milestone ? M[s.milestone] : null,
      })
      .returning();
    if (s.tagNames?.length) {
      await db.insert(taskTags).values(
        s.tagNames.map((n) => ({ taskId: t.id, tagId: T[n] }))
      );
    }
  }

  // ---- Habits (14 days of realistic logs) ----
  const habitSeeds = [
    { name: "Read 20 minutes", icon: "📖", color: "#0ea5e9", targetPerWeek: 7, pattern: [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1] },
    { name: "Exercise", icon: "🏃", color: "#10b981", targetPerWeek: 4, pattern: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0] },
    { name: "Meditate", icon: "🧘", color: "#8b5cf6", targetPerWeek: 5, pattern: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1] },
    { name: "No sugar", icon: "🚫", color: "#f59e0b", targetPerWeek: 6, pattern: [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0] },
  ];
  let hpos = 0;
  for (const h of habitSeeds) {
    hpos += 1024;
    const [habit] = await db
      .insert(habits)
      .values({
        name: h.name,
        icon: h.icon,
        color: h.color,
        targetPerWeek: h.targetPerWeek,
        position: hpos,
        userId: uid,
      })
      .returning();
    for (let i = 13; i >= 0; i--) {
      if (h.pattern[13 - i]) {
        const d = startOfDay(addDays(today, -i));
        await db.insert(habitLogs).values({ habitId: habit.id, date: d, completed: true });
      }
    }
  }

  // ---- Calendar events ----
  const eventSeeds = [
    { title: "Team standup", startsAt: at(today, 0, 9, 30), endsAt: at(today, 0, 9, 45), location: "Zoom" },
    { title: "Deep work: roadmap", startsAt: at(today, 0, 10), endsAt: at(today, 0, 12), location: "" },
    { title: "Lunch with Priya", startsAt: at(today, 0, 12, 30), endsAt: at(today, 0, 13, 30), location: "Cactus Club" },
    { title: "Dentist", startsAt: at(today, 1, 16), endsAt: at(today, 1, 17), location: "Downtown Dental" },
    { title: "Sprint planning", startsAt: at(today, 2, 10), endsAt: at(today, 2, 11, 30), location: "Room 4B" },
    { title: "Dinner with parents", startsAt: at(today, 4, 19), endsAt: at(today, 4, 21), location: "Home" },
    { title: "Flight to Vancouver", startsAt: at(today, 9, 8), endsAt: at(today, 9, 10, 30), location: "YYZ T1", allDay: false },
  ];
  for (const e of eventSeeds) {
    await db.insert(calendarEvents).values({
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      location: e.location || null,
      allDay: false,
      userId: uid,
    });
  }

  // ---- Transactions (current month) ----
  const m0 = new Date(today.getFullYear(), today.getMonth(), 1);
  const txSeeds: { label: string; amount: number; category: string; kind: "income" | "expense"; day: number }[] = [
    { label: "Salary — Capco", amount: 7200, category: "Income", kind: "income", day: 1 },
    { label: "Freelance invoice #42", amount: 850, category: "Income", kind: "income", day: 12 },
    { label: "Rent", amount: 2400, category: "Housing", kind: "expense", day: 1 },
    { label: "Whole Foods", amount: 186.42, category: "Groceries", kind: "expense", day: 3 },
    { label: "Shell gas", amount: 64.1, category: "Transport", kind: "expense", day: 4 },
    { label: "Netflix", amount: 16.99, category: "Subscriptions", kind: "expense", day: 5 },
    { label: "Loblaws", amount: 92.55, category: "Groceries", kind: "expense", day: 7 },
    { label: "Goodlife membership", amount: 59.99, category: "Health", kind: "expense", day: 8 },
    { label: "Uber", amount: 23.4, category: "Transport", kind: "expense", day: 9 },
    { label: "Blue Bottle coffee", amount: 7.5, category: "Dining", kind: "expense", day: 10 },
    { label: "Hydro bill", amount: 88.2, category: "Utilities", kind: "expense", day: 11 },
    { label: "Sushi dinner", amount: 74.0, category: "Dining", kind: "expense", day: 13 },
    { label: "Amazon — running shoes", amount: 159.99, category: "Shopping", kind: "expense", day: 14 },
    { label: "Spotify", amount: 11.99, category: "Subscriptions", kind: "expense", day: 15 },
    { label: "Petro gas", amount: 58.75, category: "Transport", kind: "expense", day: 16 },
    { label: "Farmers market", amount: 41.2, category: "Groceries", kind: "expense", day: 18 },
  ];
  for (const t of txSeeds) {
    const d = new Date(m0.getFullYear(), m0.getMonth(), Math.min(t.day, 28), 12);
    if (d > today) continue;
    await db.insert(transactions).values({
      label: t.label,
      amount: t.amount,
      category: t.category,
      kind: t.kind,
      date: d,
      userId: uid,
    });
  }

  // ---- Focus sessions (last 7 days) ----
  const focusSeeds = [
    { label: "Roadmap draft", minutes: 90, daysAgo: 0 },
    { label: "Schema design", minutes: 120, daysAgo: 1 },
    { label: "Code review", minutes: 45, daysAgo: 1 },
    { label: "Sprint work", minutes: 150, daysAgo: 2 },
    { label: "Writing", minutes: 60, daysAgo: 3 },
    { label: "Side project", minutes: 110, daysAgo: 4 },
    { label: "Deep work", minutes: 95, daysAgo: 5 },
    { label: "Planning", minutes: 50, daysAgo: 6 },
  ];
  for (const f of focusSeeds) {
    await db.insert(focusSessions).values({
      label: f.label,
      minutes: f.minutes,
      date: at(today, -f.daysAgo, 10),
      userId: uid,
    });
  }

  // ---- Notes ----
  const noteSeeds = [
    { title: "10K training notes", body: "Week 3: keep easy runs conversational. Add strides twice a week after Thursday run." },
    { title: "Book ideas", body: "1. Thinking in Systems — 2. The Mom Test — 3. Staff Engineer" },
    { title: "Japan trip", body: "Look at: Tokyo (4d), Kyoto (3d), Osaka (2d). JR pass vs regional passes." },
  ];
  for (const n of noteSeeds) {
    await db.insert(notes).values({ title: n.title, body: n.body, userId: uid });
  }

  console.log(`Seeded demo data for ${email}`);
  console.log(`  projects=${projectRows.length} tags=${tagRows.length} tasks=${taskSeeds.length} goals=3 milestones=${msRows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
