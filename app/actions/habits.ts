"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { habitSchema } from "@/lib/validations";
import { toggleHabitLog, createHabit, deleteHabit } from "@/services/habits";

const idSchema = z.string().min(1);
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function revalidateHabits() {
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createHabitAction(input: unknown) {
  const userId = await getDemoUserId();
  const habit = await createHabit(db, userId, habitSchema.parse(input));
  revalidateHabits();
  return habit;
}

export async function toggleHabitLogAction(habitId: string, dateKey: unknown) {
  const userId = await getDemoUserId();
  const key = dateKeySchema.parse(dateKey);
  // Parse as local noon to avoid timezone-day drift.
  const result = await toggleHabitLog(
    db,
    userId,
    idSchema.parse(habitId),
    new Date(`${key}T12:00:00`)
  );
  revalidateHabits();
  return result;
}

export async function deleteHabitAction(id: string) {
  const userId = await getDemoUserId();
  await deleteHabit(db, userId, idSchema.parse(id));
  revalidateHabits();
}
