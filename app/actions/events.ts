"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { eventCreateSchema, idSchema } from "@/lib/validations";
import { createEvent, updateEvent, deleteEvent } from "@/services/events";

export async function createEventAction(input: unknown) {
  const userId = await getDemoUserId();
  const event = await createEvent(db, userId, eventCreateSchema.parse(input));
  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

export async function updateEventAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  const event = await updateEvent(
    db,
    userId,
    idSchema.parse(id),
    eventCreateSchema.partial().parse(input)
  );
  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

export async function deleteEventAction(id: string) {
  const userId = await getDemoUserId();
  await deleteEvent(db, userId, idSchema.parse(id));
  revalidatePath("/calendar");
  revalidatePath("/");
}
