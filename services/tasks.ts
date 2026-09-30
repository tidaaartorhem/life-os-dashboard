import { and, asc, desc, eq, gte, lte, like, or } from "drizzle-orm";
import { goals, milestones, projects, tags, tasks, taskTags } from "@/db/schema";
import type { DbClient } from "@/lib/db";
import type { TaskInput } from "@/lib/validations";
import type { Project, Tag, Task, TaskDto, TaskStatus } from "@/types";

const taskWith = {
  project: true,
  goal: { columns: { id: true, title: true } },
  milestone: { columns: { id: true, title: true } },
  taskTags: { with: { tag: true } },
} as const;

type TaskRow = Task & {
  project: Project | null;
  goal: { id: string; title: string } | null;
  milestone: { id: string; title: string } | null;
  taskTags: { tag: Tag }[];
};

export function toTaskDto(row: TaskRow): TaskDto {
  const { taskTags: tt, ...rest } = row;
  return { ...rest, tags: tt.map((t) => t.tag) };
}

export interface TaskFilters {
  statuses?: TaskStatus[];
  projectId?: string;
  tagId?: string;
  priorities?: string[];
  search?: string;
  dueFrom?: Date;
  dueTo?: Date;
  goalId?: string;
}

export async function listTasks(
  client: DbClient,
  userId: string,
  filters: TaskFilters = {}
): Promise<TaskDto[]> {
  return queryTasks(client, userId, filters);
}

async function queryTasks(
  client: DbClient,
  userId: string,
  filters: TaskFilters
): Promise<TaskDto[]> {
  const conds = [eq(tasks.userId, userId)];
  if (filters.statuses?.length) {
    conds.push(or(...filters.statuses.map((s) => eq(tasks.status, s)))!);
  }
  if (filters.priorities?.length) {
    conds.push(or(...filters.priorities.map((p) => eq(tasks.priority, p)))!);
  }
  if (filters.projectId) conds.push(eq(tasks.projectId, filters.projectId));
  if (filters.goalId) conds.push(eq(tasks.goalId, filters.goalId));
  if (filters.dueFrom) conds.push(gte(tasks.dueDate, filters.dueFrom));
  if (filters.dueTo) conds.push(lte(tasks.dueDate, filters.dueTo));
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    conds.push(or(like(tasks.title, q), like(tasks.description, q))!);
  }

  const rows = (await client.query.tasks.findMany({
    where: and(...conds),
    with: taskWith,
    orderBy: [asc(tasks.position), desc(tasks.createdAt)],
  })) as TaskRow[];

  if (filters.tagId) {
    return rows
      .filter((r) => r.taskTags.some((t) => t.tag.id === filters.tagId))
      .map(toTaskDto);
  }
  return rows.map(toTaskDto);
}

export async function getTask(
  client: DbClient,
  userId: string,
  id: string
): Promise<TaskDto | null> {
  const row = (await client.query.tasks.findFirst({
    where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
    with: taskWith,
  })) as TaskRow | undefined;
  return row ? toTaskDto(row) : null;
}

async function nextPosition(
  client: DbClient,
  userId: string,
  status: string
): Promise<number> {
  const rows = await client.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), eq(tasks.status, status)),
    columns: { position: true },
    orderBy: [desc(tasks.position)],
    limit: 1,
  });
  return (rows[0]?.position ?? 0) + 1024;
}

function emptyToNull(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v : null;
}

export async function createTask(
  client: DbClient,
  userId: string,
  input: TaskInput
): Promise<TaskDto> {
  const position = await nextPosition(client, userId, input.status);
  const [row] = await client
    .insert(tasks)
    .values({
      title: input.title,
      description: emptyToNull(input.description ?? null),
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      position,
      estimatedMinutes: input.estimatedMinutes ?? null,
      userId,
      projectId: emptyToNull(input.projectId ?? null),
      goalId: emptyToNull(input.goalId ?? null),
      milestoneId: emptyToNull(input.milestoneId ?? null),
    })
    .returning();
  if (input.tagIds.length) {
    await client.insert(taskTags).values(
      input.tagIds.map((tagId) => ({ taskId: row.id, tagId }))
    );
  }
  const created = await getTask(client, userId, row.id);
  if (!created) throw new Error("Failed to load created task");
  return created;
}

export async function updateTask(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<TaskInput>
): Promise<TaskDto> {
  const existing = await getTask(client, userId, id);
  if (!existing) throw new Error("Task not found");

  const patch: Partial<typeof tasks.$inferInsert> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined)
    patch.description = emptyToNull(input.description ?? null);
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate ?? null;
  if (input.projectId !== undefined)
    patch.projectId = emptyToNull(input.projectId ?? null);
  if (input.goalId !== undefined) patch.goalId = emptyToNull(input.goalId ?? null);
  if (input.milestoneId !== undefined)
    patch.milestoneId = emptyToNull(input.milestoneId ?? null);
  if (input.estimatedMinutes !== undefined)
    patch.estimatedMinutes = input.estimatedMinutes ?? null;
  patch.updatedAt = new Date();

  // Completing / reopening via status change keeps completedAt in sync.
  if (input.status === "done" && existing.status !== "done") {
    patch.completedAt = new Date();
  } else if (input.status && input.status !== "done" && existing.status === "done") {
    patch.completedAt = null;
  }

  await client
    .update(tasks)
    .set(patch)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  if (input.tagIds !== undefined) {
    await client.delete(taskTags).where(eq(taskTags.taskId, id));
    if (input.tagIds.length) {
      await client
        .insert(taskTags)
        .values(input.tagIds.map((tagId) => ({ taskId: id, tagId })));
    }
  }

  const updated = await getTask(client, userId, id);
  if (!updated) throw new Error("Failed to load updated task");
  return updated;
}

export async function toggleTaskComplete(
  client: DbClient,
  userId: string,
  id: string
): Promise<TaskDto> {
  const existing = await getTask(client, userId, id);
  if (!existing) throw new Error("Task not found");
  return updateTask(client, userId, id, {
    status: existing.status === "done" ? "todo" : "done",
  });
}

export async function deleteTask(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

/**
 * Move a task to another status column (Kanban drag & drop) and optionally
 * reorder it before another task. Positions are re-spaced for the affected
 * column(s) so ordering stays stable.
 */
export async function moveTask(
  client: DbClient,
  userId: string,
  id: string,
  targetStatus: TaskStatus,
  beforeId?: string | null
): Promise<void> {
  const moving = await getTask(client, userId, id);
  if (!moving) throw new Error("Task not found");

  const sourceStatus = moving.status as TaskStatus;
  const affected =
    sourceStatus === targetStatus ? [targetStatus] : [sourceStatus, targetStatus];

  for (const status of affected) {
    const column = await client.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), eq(tasks.status, status)),
      columns: { id: true, position: true },
      orderBy: [asc(tasks.position), desc(tasks.createdAt)],
    });
    let ids = column.map((c) => c.id).filter((tid) => tid !== id);
    if (status === targetStatus) {
      const at = beforeId ? ids.indexOf(beforeId) : -1;
      if (at >= 0) ids.splice(at, 0, id);
      else ids.push(id);
    }
    for (let i = 0; i < ids.length; i++) {
      await client
        .update(tasks)
        .set({ position: (i + 1) * 1024, updatedAt: new Date() })
        .where(eq(tasks.id, ids[i]));
    }
  }

  await client
    .update(tasks)
    .set({
      status: targetStatus,
      completedAt: targetStatus === "done" ? moving.completedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}
