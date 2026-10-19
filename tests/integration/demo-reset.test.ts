import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type TestContext } from "./helpers";
import { resetDemoData } from "@/services/misc";
import { createTask } from "@/services/tasks";
import { tasks, users } from "@/db/schema";

let ctx: TestContext;
afterEach(() => ctx?.cleanup());

const ymd = (d: Date) => [d.getFullYear(), d.getMonth(), d.getDate()];

async function demoUserId() {
  const user = await ctx.db.query.users.findFirst({
    where: eq(users.email, ctx.userEmail),
  });
  if (!user) throw new Error("demo user missing after reset");
  return user.id;
}

describe("resetDemoData", () => {
  it("re-anchors all seed dates to the given now", async () => {
    ctx = await createTestDb();

    await resetDemoData(ctx.db, {
      email: ctx.userEmail,
      now: new Date(2026, 0, 15, 12),
    });
    const janTasks = await ctx.db.query.tasks.findMany({
      where: eq(tasks.userId, await demoUserId()),
    });
    const roadmapJan = janTasks.find((t) => t.title === "Review Q3 roadmap draft");
    expect(roadmapJan).toBeDefined();
    expect(ymd(roadmapJan!.dueDate!)).toEqual([2026, 0, 15]);

    await resetDemoData(ctx.db, {
      email: ctx.userEmail,
      now: new Date(2026, 9, 19, 12),
    });
    const octTasks = await ctx.db.query.tasks.findMany({
      where: eq(tasks.userId, await demoUserId()),
    });
    const roadmapOct = octTasks.find((t) => t.title === "Review Q3 roadmap draft");
    expect(roadmapOct).toBeDefined();
    // Same seed task, moved from the January anchor to the October anchor.
    expect(ymd(roadmapOct!.dueDate!)).toEqual([2026, 9, 19]);
    expect(octTasks).toHaveLength(janTasks.length);
  });

  it("is idempotent: repeated resets rebuild the same dataset", async () => {
    ctx = await createTestDb();
    const opts = { email: ctx.userEmail, now: new Date(2026, 9, 19, 12) };

    const first = await resetDemoData(ctx.db, opts);
    const second = await resetDemoData(ctx.db, opts);

    expect(second).toEqual(first);
    expect(first.tasks).toBeGreaterThan(0);
    expect(first.goals).toBe(3);

    const allTasks = await ctx.db.query.tasks.findMany({
      where: eq(tasks.userId, await demoUserId()),
    });
    expect(allTasks).toHaveLength(first.tasks);
    // No duplicate seed rows leaked in from the first reset.
    const titles = allTasks.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("only touches the demo user's data", async () => {
    ctx = await createTestDb();

    // A second, real-ish user with their own task in the same database.
    const [other] = await ctx.db
      .insert(users)
      .values({ email: "other@example.com", name: "Other" })
      .returning();
    await createTask(ctx.db, other.id, {
      title: "Other user's task",
      description: null,
      status: "todo",
      priority: "medium",
      dueDate: null,
      projectId: null,
      goalId: null,
      milestoneId: null,
      tagIds: [],
      estimatedMinutes: null,
    });

    await resetDemoData(ctx.db, {
      email: ctx.userEmail,
      now: new Date(2026, 9, 19, 12),
    });

    const otherTasks = await ctx.db.query.tasks.findMany({
      where: eq(tasks.userId, other.id),
    });
    expect(otherTasks).toHaveLength(1);
    expect(otherTasks[0].title).toBe("Other user's task");

    const demoTasks = await ctx.db.query.tasks.findMany({
      where: eq(tasks.userId, await demoUserId()),
    });
    expect(demoTasks.length).toBeGreaterThan(0);
    expect(
      demoTasks.every((t) => t.title !== "Other user's task")
    ).toBe(true);
  });
});
