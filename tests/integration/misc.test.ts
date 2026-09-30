import { afterEach, describe, expect, it } from "vitest";
import { createTestDb, type TestContext } from "./helpers";
import {
  createTransaction,
  listTransactions,
  deleteTransaction,
  createNote,
  listNotes,
  deleteNote,
  createFocusSession,
  listFocusSessions,
  createProject,
  createTag,
} from "@/services/misc";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
} from "@/services/events";
import { getDashboardData, getAnalytics } from "@/services/insights";
import { createTask, toggleTaskComplete } from "@/services/tasks";

let ctx: TestContext;
afterEach(() => ctx?.cleanup());

describe("finance, notes, focus, events", () => {
  it("manages transactions", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const tx = await createTransaction(db, userId, {
      label: "Groceries",
      amount: 84.2,
      category: "Food",
      date: new Date("2026-09-30T12:00:00"),
      kind: "expense",
    });
    expect(tx.amount).toBe(84.2);
    expect(await listTransactions(db, userId)).toHaveLength(1);
    await deleteTransaction(db, userId, tx.id);
    expect(await listTransactions(db, userId)).toHaveLength(0);
  });

  it("manages notes", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const note = await createNote(db, userId, {
      title: "Idea",
      body: "Build something useful.",
    });
    expect((await listNotes(db, userId))[0].title).toBe("Idea");
    await deleteNote(db, userId, note.id);
    expect(await listNotes(db, userId)).toHaveLength(0);
  });

  it("logs focus sessions", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    await createFocusSession(db, userId, {
      label: "Deep work",
      minutes: 50,
      date: new Date("2026-09-30T12:00:00"),
    });
    const sessions = await listFocusSessions(db, userId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].minutes).toBe(50);
  });

  it("manages calendar events", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const event = await createEvent(db, userId, {
      title: "Dentist",
      description: null,
      location: "Main St",
      startsAt: new Date("2026-10-02T09:00:00"),
      endsAt: new Date("2026-10-02T10:00:00"),
      allDay: false,
    });
    const from = new Date("2026-10-01T00:00:00");
    const to = new Date("2026-10-03T00:00:00");
    expect(await listEvents(db, userId, from, to)).toHaveLength(1);

    await updateEvent(db, userId, event.id, { location: "Elm St" });
    expect((await listEvents(db, userId, from, to))[0].location).toBe("Elm St");

    await expect(
      createEvent(db, userId, {
        title: "Bad",
        description: null,
        location: null,
        startsAt: new Date("2026-10-02T10:00:00"),
        endsAt: new Date("2026-10-02T09:00:00"),
        allDay: false,
      })
    ).rejects.toThrow();

    await deleteEvent(db, userId, event.id);
    expect(await listEvents(db, userId, from, to)).toHaveLength(0);
  });

  it("creates projects and tags", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const project = await createProject(db, userId, {
      name: "Side project",
      color: "#6366f1",
    });
    const tag = await createTag(db, userId, {
      name: "deep-work",
      color: "#8b5cf6",
    });
    const task = await createTask(db, userId, {
      title: "Tagged task",
      description: null,
      status: "todo",
      priority: "medium",
      dueDate: null,
      projectId: project.id,
      goalId: null,
      milestoneId: null,
      tagIds: [tag.id],
      estimatedMinutes: null,
    });
    expect(task.project?.name).toBe("Side project");
    expect(task.tags.map((t) => t.name)).toContain("deep-work");
  });
});

describe("dashboard + analytics aggregates", () => {
  it("computes dashboard counts and finance summary", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const base = {
      description: null,
      status: "todo" as const,
      priority: "medium" as const,
      projectId: null,
      goalId: null,
      milestoneId: null,
      tagIds: [],
      estimatedMinutes: null,
    };
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await createTask(db, userId, { ...base, title: "Due today", dueDate: today });
    await createTask(db, userId, { ...base, title: "Overdue", dueDate: yesterday });
    const done = await createTask(db, userId, { ...base, title: "Done task" });
    await toggleTaskComplete(db, userId, done.id);

    await createTransaction(db, userId, {
      label: "Paycheck",
      amount: 3000,
      category: "Salary",
      date: today,
      kind: "income",
    });
    await createTransaction(db, userId, {
      label: "Rent",
      amount: 1500,
      category: "Housing",
      date: today,
      kind: "expense",
    });

    const data = await getDashboardData(db, userId);
    expect(data.counts.dueToday).toBe(1);
    expect(data.counts.overdue).toBe(1);
    expect(data.counts.completedThisWeek).toBe(1);
    expect(data.finance.monthIncome).toBe(3000);
    expect(data.finance.monthExpenses).toBe(1500);
    expect(data.finance.topCategories[0]).toEqual({
      category: "Housing",
      total: 1500,
    });
  });

  it("computes analytics aggregates", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const t = await createTask(db, userId, {
      title: "Analytics task",
      description: null,
      status: "todo",
      priority: "high",
      dueDate: null,
      projectId: null,
      goalId: null,
      milestoneId: null,
      tagIds: [],
      estimatedMinutes: null,
    });
    await toggleTaskComplete(db, userId, t.id);
    await createFocusSession(db, userId, {
      label: null,
      minutes: 60,
      date: new Date(),
    });

    const a = await getAnalytics(db, userId);
    expect(a.totalCompleted30d).toBe(1);
    expect(a.completionRate30d).toBe(100);
    expect(a.tasksByStatus.find((s) => s.status === "done")?.count).toBe(1);
    expect(a.focusByDay.reduce((s, d) => s + d.minutes, 0)).toBe(60);
    expect(a.completionTrend).toHaveLength(30);
    expect(a.focusByDay).toHaveLength(14);
  });
});
