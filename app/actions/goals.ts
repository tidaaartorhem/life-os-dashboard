"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { goalSchema, milestoneSchema } from "@/lib/validations";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/services/goals";

const idSchema = z.string().min(1);

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createGoalAction(input: unknown) {
  const userId = await getDemoUserId();
  const goal = await createGoal(db, userId, goalSchema.parse(input));
  revalidateGoals();
  return goal;
}

export async function updateGoalAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  const goal = await updateGoal(
    db,
    userId,
    idSchema.parse(id),
    goalSchema.partial().parse(input)
  );
  revalidateGoals();
  return goal;
}

export async function deleteGoalAction(id: string) {
  const userId = await getDemoUserId();
  await deleteGoal(db, userId, idSchema.parse(id));
  revalidateGoals();
}

export async function createMilestoneAction(goalId: string, input: unknown) {
  const userId = await getDemoUserId();
  const milestone = await createMilestone(
    db,
    userId,
    milestoneSchema.parse({ ...(input as object), goalId })
  );
  revalidateGoals();
  return milestone;
}

export async function updateMilestoneAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  await updateMilestone(
    db,
    userId,
    idSchema.parse(id),
    milestoneSchema.omit({ goalId: true }).partial().parse(input)
  );
  revalidateGoals();
}

export async function deleteMilestoneAction(id: string) {
  const userId = await getDemoUserId();
  await deleteMilestone(db, userId, idSchema.parse(id));
  revalidateGoals();
}
