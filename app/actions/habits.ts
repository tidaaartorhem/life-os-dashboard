"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { idSchema } from "@/lib/validations";
import { toggleHabitLog, createHabit, deleteHabit } from "@/services/habits";

const habitSchema = z.object({
  name: z.string().min(1).max(80),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  targetPerWeek: z.number().int().min(1).max(7).default(5),
});

export async function createHabitAction(input: unknown) {
  const userId = await getDemoUserId();
  const habit = await createHabit(db, userId, habitSchema.parse(input));
  revalidatePath("/");
  revalidatePath("/analytics");
  return habit;
}

export async function toggleHabitLogAction(habitId: string, date: string) {
  const userId = await getDemoUserId();
  const result = await toggleHabitLog(
    db,
    userId,
    idSchema.parse(habitId),
    z.string().date().parse(date)
  );
  revalidatePath("/");
  revalidatePath("/analytics");
  return result;
}

export async function deleteHabitAction(id: string) {
  const userId = await getDemoUserId();
  await deleteHabit(db, userId, idSchema.parse(id));
  revalidatePath("/");
  revalidatePath("/analytics");
}
