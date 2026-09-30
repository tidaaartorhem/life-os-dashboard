import { and, asc, desc, eq } from "drizzle-orm";
import { goals, milestones } from "@/db/schema";
import type { DbClient } from "@/lib/db";
import type { GoalInput, MilestoneInput } from "@/lib/validations";
import type { GoalDto, MilestoneDto } from "@/types";
import { toTaskDto } from "./tasks";

function progressOf(total: number, done: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export async function listGoals(
  client: DbClient,
  userId: string
): Promise<GoalDto[]> {
  const rows = await client.query.goals.findMany({
    where: eq(goals.userId, userId),
    with: {
      milestones: {
        with: {
          tasks: {
            with: {
              project: true,
              goal: { columns: { id: true, title: true } },
              milestone: { columns: { id: true, title: true } },
              taskTags: { with: { tag: true } },
            },
            orderBy: [asc(milestones.id)],
          },
        },
        orderBy: [asc(milestones.position)],
      },
      tasks: {
        with: {
          project: true,
          goal: { columns: { id: true, title: true } },
          milestone: { columns: { id: true, title: true } },
          taskTags: { with: { tag: true } },
        },
      },
    },
    orderBy: [desc(goals.createdAt)],
  });

  return rows.map((g) => {
    const milestoneDtos: MilestoneDto[] = g.milestones.map((m) => {
      const taskDtos = m.tasks.map((t) =>
        toTaskDto(t as unknown as Parameters<typeof toTaskDto>[0])
      );
      const done = taskDtos.filter((t) => t.status === "done").length;
      return {
        ...m,
        tasks: taskDtos,
        totalTasks: taskDtos.length,
        doneTasks: done,
        progress: progressOf(taskDtos.length, done),
      };
    });
    const directTasks = g.tasks
      .filter((t) => !t.milestoneId)
      .map((t) => toTaskDto(t as unknown as Parameters<typeof toTaskDto>[0]));
    const allTasks = [
      ...directTasks,
      ...milestoneDtos.flatMap((m) => m.tasks),
    ];
    const done = allTasks.filter((t) => t.status === "done").length;
    return {
      ...g,
      milestones: milestoneDtos,
      tasks: directTasks,
      totalTasks: allTasks.length,
      doneTasks: done,
      progress: progressOf(allTasks.length, done),
    };
  });
}

export async function getGoal(
  client: DbClient,
  userId: string,
  id: string
): Promise<GoalDto | null> {
  const all = await listGoals(client, userId);
  return all.find((g) => g.id === id) ?? null;
}

function emptyToNull(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v : null;
}

export async function createGoal(
  client: DbClient,
  userId: string,
  input: GoalInput
) {
  const [row] = await client
    .insert(goals)
    .values({
      title: input.title,
      description: emptyToNull(input.description ?? null),
      targetDate: input.targetDate ?? null,
      status: input.status,
      userId,
    })
    .returning();
  return row;
}

export async function updateGoal(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<GoalInput>
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined)
    patch.description = emptyToNull(input.description ?? null);
  if (input.targetDate !== undefined) patch.targetDate = input.targetDate ?? null;
  if (input.status !== undefined) patch.status = input.status;
  await client
    .update(goals)
    .set(patch)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  return getGoal(client, userId, id);
}

export async function deleteGoal(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
}

export async function createMilestone(
  client: DbClient,
  userId: string,
  input: MilestoneInput
) {
  // Ensure the goal belongs to the user.
  const goal = await client.query.goals.findFirst({
    where: and(eq(goals.id, input.goalId), eq(goals.userId, userId)),
    columns: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const existing = await client.query.milestones.findMany({
    where: eq(milestones.goalId, input.goalId),
    columns: { position: true },
    orderBy: [desc(milestones.position)],
    limit: 1,
  });
  const [row] = await client
    .insert(milestones)
    .values({
      title: input.title,
      targetDate: input.targetDate ?? null,
      goalId: input.goalId,
      position: (existing[0]?.position ?? 0) + 1024,
    })
    .returning();
  return row;
}

export async function updateMilestone(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<MilestoneInput>
) {
  const row = await client.query.milestones.findFirst({
    where: eq(milestones.id, id),
    with: { goal: { columns: { userId: true } } },
  });
  if (!row || row.goal.userId !== userId) throw new Error("Milestone not found");
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.targetDate !== undefined) patch.targetDate = input.targetDate ?? null;
  await client.update(milestones).set(patch).where(eq(milestones.id, id));
}

export async function deleteMilestone(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  const row = await client.query.milestones.findFirst({
    where: eq(milestones.id, id),
    with: { goal: { columns: { userId: true } } },
  });
  if (!row || row.goal.userId !== userId) throw new Error("Milestone not found");
  await client.delete(milestones).where(eq(milestones.id, id));
}
