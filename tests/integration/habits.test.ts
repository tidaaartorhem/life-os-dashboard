import { afterEach, describe, expect, it } from "vitest";
import { createTestDb, type TestContext } from "./helpers";
import {
  createHabit,
  toggleHabitLog,
  deleteHabit,
  listHabits,
} from "@/services/habits";
import { toISODate } from "@/lib/dates";

let ctx: TestContext;
afterEach(() => ctx?.cleanup());

const noon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

describe("habit tracking", () => {
  it("creates a habit with defaults", async () => {
    ctx = await createTestDb();
    const habit = await createHabit(ctx.db, ctx.userId, {
      name: "Read 20 pages",
      icon: null,
      color: "#6366f1",
      targetPerWeek: 5,
    });
    expect(habit.name).toBe("Read 20 pages");
    expect(habit.targetPerWeek).toBe(5);
  });

  it("toggles a log on and off for a given day", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const habit = await createHabit(db, userId, {
      name: "Meditate",
      icon: null,
      color: "#6366f1",
      targetPerWeek: 7,
    });

    const today = noon(new Date());
    const on = await toggleHabitLog(db, userId, habit.id, today);
    expect(on.completed).toBe(true);

    let habits = await listHabits(db, userId);
    expect(habits[0].completedToday).toBe(true);
    expect(habits[0].logsByDate[toISODate(today)]).toBe(true);

    const off = await toggleHabitLog(db, userId, habit.id, today);
    expect(off.completed).toBe(false);
    habits = await listHabits(db, userId);
    expect(habits[0].completedToday).toBe(false);
  });

  it("computes consecutive-day streaks", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const habit = await createHabit(db, userId, {
      name: "Exercise",
      icon: null,
      color: "#22c55e",
      targetPerWeek: 7,
    });

    // Log today and the two previous days -> streak of 3.
    for (let i = 0; i < 3; i++) {
      const d = noon(new Date());
      d.setDate(d.getDate() - i);
      await toggleHabitLog(db, userId, habit.id, d);
    }
    const habits = await listHabits(db, userId);
    expect(habits[0].streak).toBe(3);
  });

  it("deletes a habit", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;
    const habit = await createHabit(db, userId, {
      name: "Temporary",
      icon: null,
      color: "#6366f1",
      targetPerWeek: 3,
    });
    await deleteHabit(db, userId, habit.id);
    expect(await listHabits(db, userId)).toHaveLength(0);
  });
});
