import { afterEach, describe, expect, it } from "vitest";
import { createTestDb, type TestContext } from "./helpers";
import {
  createTask,
  updateTask,
  toggleTaskComplete,
  moveTask,
  deleteTask,
  listTasks,
  getTask,
} from "@/services/tasks";

let ctx: TestContext;
afterEach(() => ctx?.cleanup());

describe("task lifecycle", () => {
  it("creates, lists, updates, toggles, moves, and deletes a task", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;

    const created = await createTask(db, userId, {
      title: "Write report",
      description: null,
      status: "todo",
      priority: "high",
      dueDate: null,
      projectId: null,
      goalId: null,
      milestoneId: null,
      tagIds: [],
      estimatedMinutes: 30,
    });
    expect(created.title).toBe("Write report");
    expect(created.status).toBe("todo");
    expect(created.tags).toEqual([]);

    const listed = await listTasks(db, userId);
    expect(listed).toHaveLength(1);

    const updated = await updateTask(db, userId, created.id, {
      title: "Write quarterly report",
      priority: "urgent",
    });
    expect(updated.title).toBe("Write quarterly report");
    expect(updated.priority).toBe("urgent");

    const toggled = await toggleTaskComplete(db, userId, created.id);
    expect(toggled.status).toBe("done");
    expect(toggled.completedAt).not.toBeNull();

    const reopened = await toggleTaskComplete(db, userId, created.id);
    expect(reopened.status).toBe("todo");

    await moveTask(db, userId, created.id, "in_progress");
    const moved = await getTask(db, userId, created.id);
    expect(moved?.status).toBe("in_progress");

    await deleteTask(db, userId, created.id);
    expect(await listTasks(db, userId)).toHaveLength(0);
  });

  it("scopes tasks to the owning user", async () => {
    ctx = await createTestDb();
    const other = await createTestDb();
    try {
      await createTask(ctx.db, ctx.userId, {
        title: "Mine",
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
      expect(await listTasks(ctx.db, ctx.userId)).toHaveLength(1);
      expect(await listTasks(other.db, other.userId)).toHaveLength(0);
    } finally {
      other.cleanup();
    }
  });

  it("filters tasks by status and search", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const base = {
      description: null,
      status: "todo" as const,
      priority: "medium" as const,
      dueDate: null,
      projectId: null,
      goalId: null,
      milestoneId: null,
      tagIds: [],
      estimatedMinutes: null,
    };
    await createTask(db, userId, { ...base, title: "Buy groceries" });
    const done = await createTask(db, userId, { ...base, title: "Pay rent" });
    await toggleTaskComplete(db, userId, done.id);

    expect(await listTasks(db, userId, { statuses: ["todo"] })).toHaveLength(1);
    expect(await listTasks(db, userId, { statuses: ["done"] })).toHaveLength(1);
    expect(
      await listTasks(db, userId, { search: "groceries" })
    ).toHaveLength(1);
    expect(await listTasks(db, userId, { search: "nope" })).toHaveLength(0);
  });
});
