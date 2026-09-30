"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import {
  goalCreateSchema,
  goalUpdateSchema,
  milestoneCreateSchema,
  idSchema,
} from "@/lib/validations";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
} from "@/services/goals";

export async function createGoalAction(input: unknown) {
  const userId = await getDemoUserId();
  const goal = await createGoal(db, userId, goalCreateSchema.parse(input));
  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/analytics");
  return goal;
}

export async function updateGoalAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  const goal = await updateGoal(
    db,
    userId,
    idSchema.parse(id),
    goalUpdateSchema.parse(input)
  );
  revalidatePath("/goals");
  revalidatePath("/");
  return goal;
}

export async function deleteGoalAction(id: string) {
  const userId = await getDemoUserId();
  await deleteGoal(db, userId, idSchema.parse(id));
  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createMilestoneAction(goalId: string, input: unknown) {
  const userId = await getDemoUserId();
  const milestone = await createMilestone(
    db,
    userId,
    idSchema.parse(goalId),
    milestoneCreateSchema.parse(input)
  );
  revalidatePath("/goals");
  revalidatePath("/");
  return milestone;
}

export async function toggleMilestoneAction(id: string) {
  const userId = await getDemoUserId();
  const milestone = await toggleMilestone(db, userId, idSchema.parse(id));
  revalidatePath("/goals");
  revalidatePath("/");
  return milestone;
}

export async function deleteMilestoneAction(id: string) {
  const userId = await getDemoUserId();
  await deleteMilestone(db, userId, idSchema.parse(id));
  revalidatePath("/goals");
  revalidatePath("/");
}
