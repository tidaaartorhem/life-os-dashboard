import { afterEach, describe, expect, it } from "vitest";
import { createTestDb, type TestContext } from "./helpers";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  listGoals,
} from "@/services/goals";
import { createTask, toggleTaskComplete } from "@/services/tasks";

let ctx: TestContext;
afterEach(() => ctx?.cleanup());

const taskBase = {
  description: null,
  status: "todo" as const,
  priority: "medium" as const,
  dueDate: null,
  projectId: null,
  milestoneId: null,
  tagIds: [],
  estimatedMinutes: null,
};

describe("goal journey (acceptance path)", () => {
  it("goal -> milestone -> linked task with due date -> complete -> progress updates", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;

    // 1. Create a goal
    const goal = await createGoal(db, userId, {
      title: "Learn Spanish",
      description: "Conversational by year end",
      targetDate: new Date("2026-12-31T12:00:00"),
      status: "active",
    });
    expect(goal.title).toBe("Learn Spanish");

    // 2. Add a milestone
    const milestone = await createMilestone(db, userId, {
      title: "Finish A1 course",
      targetDate: new Date("2026-10-31T12:00:00"),
      goalId: goal.id,
    });
    expect(milestone.goalId).toBe(goal.id);

    // 3. Link a task with a due date to the goal + milestone
    const due = new Date();
    due.setDate(due.getDate() + 2);
    const task = await createTask(db, userId, {
      ...taskBase,
      title: "Complete lesson 5",
      goalId: goal.id,
      milestoneId: milestone.id,
      dueDate: due,
    });
    expect(task.goalId).toBe(goal.id);
    expect(task.milestoneId).toBe(milestone.id);

    // 4. Progress starts at 0%
    let goals = await listGoals(db, userId);
    expect(goals).toHaveLength(1);
    expect(goals[0].progress).toBe(0);
    expect(goals[0].totalTasks).toBe(1);

    // 5. Complete the task -> progress reflects it
    await toggleTaskComplete(db, userId, task.id);
    goals = await listGoals(db, userId);
    expect(goals[0].progress).toBe(100);
    expect(goals[0].doneTasks).toBe(1);
    expect(goals[0].milestones[0].progress).toBe(100);
  });

  it("supports multiple milestones with partial progress", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;

    const goal = await createGoal(db, userId, {
      title: "Fitness",
      description: null,
      targetDate: null,
      status: "active",
    });
    const m1 = await createMilestone(db, userId, {
      title: "Phase 1",
      targetDate: null,
      goalId: goal.id,
    });
    const m2 = await createMilestone(db, userId, {
      title: "Phase 2",
      targetDate: null,
      goalId: goal.id,
    });

    const t1 = await createTask(db, userId, {
      ...taskBase,
      title: "Workout A",
      goalId: goal.id,
      milestoneId: m1.id,
    });
    await createTask(db, userId, {
      ...taskBase,
      title: "Workout B",
      goalId: goal.id,
      milestoneId: m1.id,
    });
    await createTask(db, userId, {
      ...taskBase,
      title: "Workout C",
      goalId: goal.id,
      milestoneId: m2.id,
    });
    await toggleTaskComplete(db, userId, t1.id);

    const [g] = await listGoals(db, userId);
    expect(g.totalTasks).toBe(3);
    expect(g.doneTasks).toBe(1);
    expect(g.progress).toBe(33); // Math.round(1/3*100)
    expect(g.milestones.find((m) => m.id === m1.id)?.progress).toBe(50);
    expect(g.milestones.find((m) => m.id === m2.id)?.progress).toBe(0);
  });

  it("updates and deletes goals and milestones", async () => {
    ctx = await createTestDb();
    const { db, userId } = ctx;

    const goal = await createGoal(db, userId, {
      title: "Draft",
      description: null,
      targetDate: null,
      status: "active",
    });
    const updated = await updateGoal(db, userId, goal.id, {
      title: "Published",
      status: "completed",
    });
    expect(updated?.title).toBe("Published");
    expect(updated?.status).toBe("completed");

    const ms = await createMilestone(db, userId, {
      title: "Step 1",
      targetDate: null,
      goalId: goal.id,
    });
    await updateMilestone(db, userId, ms.id, { title: "Step one" });
    await deleteMilestone(db, userId, ms.id);
    let goals = await listGoals(db, userId);
    expect(goals[0].milestones).toHaveLength(0);

    await deleteGoal(db, userId, goal.id);
    goals = await listGoals(db, userId);
    expect(goals).toHaveLength(0);
  });
});
