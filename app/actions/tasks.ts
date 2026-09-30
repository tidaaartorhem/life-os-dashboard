"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import {
  taskCreateSchema,
  taskUpdateSchema,
  idSchema,
} from "@/lib/validations";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  moveTask,
  createProject,
  createTag,
} from "@/services/tasks";
import { z } from "zod";

const projectSchema = z.object({ name: z.string().min(1).max(80) });
const tagSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function createTaskAction(input: unknown) {
  const userId = await getDemoUserId();
  const task = await createTask(db, userId, taskCreateSchema.parse(input));
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return task;
}

export async function updateTaskAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  const task = await updateTask(
    db,
    userId,
    idSchema.parse(id),
    taskUpdateSchema.parse(input)
  );
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return task;
}

export async function toggleTaskAction(id: string) {
  const userId = await getDemoUserId();
  const task = await toggleTask(db, userId, idSchema.parse(id));
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/analytics");
  return task;
}

export async function deleteTaskAction(id: string) {
  const userId = await getDemoUserId();
  await deleteTask(db, userId, idSchema.parse(id));
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
}

export async function moveTaskAction(id: string, toStatus: string) {
  const userId = await getDemoUserId();
  const task = await moveTask(db, userId, idSchema.parse(id), toStatus);
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/analytics");
  return task;
}

export async function createProjectAction(input: unknown) {
  const userId = await getDemoUserId();
  const project = await createProject(
    db,
    userId,
    projectSchema.parse(input).name
  );
  revalidatePath("/tasks");
  return project;
}

export async function createTagAction(input: unknown) {
  const userId = await getDemoUserId();
  const parsed = tagSchema.parse(input);
  const tag = await createTag(db, userId, parsed.name, parsed.color);
  revalidatePath("/tasks");
  return tag;
}
