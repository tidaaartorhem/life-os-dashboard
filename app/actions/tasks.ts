"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { taskSchema, projectSchema, tagSchema } from "@/lib/validations";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  moveTask,
} from "@/services/tasks";
import { createProject, createTag } from "@/services/misc";

const idSchema = z.string().min(1);
const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

const TASK_PATHS = ["/tasks", "/", "/goals", "/calendar", "/analytics"];

function revalidateTasks() {
  for (const p of TASK_PATHS) revalidatePath(p);
}

export async function createTaskAction(input: unknown) {
  const userId = await getDemoUserId();
  const task = await createTask(db, userId, taskSchema.parse(input));
  revalidateTasks();
  return task;
}

export async function updateTaskAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  const task = await updateTask(
    db,
    userId,
    idSchema.parse(id),
    taskSchema.partial().parse(input)
  );
  revalidateTasks();
  return task;
}

export async function toggleTaskAction(id: string) {
  const userId = await getDemoUserId();
  const task = await toggleTaskComplete(db, userId, idSchema.parse(id));
  revalidateTasks();
  return task;
}

export async function deleteTaskAction(id: string) {
  const userId = await getDemoUserId();
  await deleteTask(db, userId, idSchema.parse(id));
  revalidateTasks();
}

export async function moveTaskAction(id: string, toStatus: unknown) {
  const userId = await getDemoUserId();
  await moveTask(
    db,
    userId,
    idSchema.parse(id),
    taskStatusSchema.parse(toStatus)
  );
  revalidateTasks();
}

export async function createProjectAction(input: unknown) {
  const userId = await getDemoUserId();
  const project = await createProject(db, userId, projectSchema.parse(input));
  revalidatePath("/tasks");
  return project;
}

export async function createTagAction(input: unknown) {
  const userId = await getDemoUserId();
  const tag = await createTag(db, userId, tagSchema.parse(input));
  revalidatePath("/tasks");
  return tag;
}
