"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { createEvent, updateEvent, deleteEvent } from "@/services/events";

const idSchema = z.string().min(1);

function revalidateEvents() {
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function createEventAction(input: unknown) {
  const userId = await getDemoUserId();
  const event = await createEvent(db, userId, eventSchema.parse(input));
  revalidateEvents();
  return event;
}

export async function updateEventAction(id: string, input: unknown) {
  const userId = await getDemoUserId();
  await updateEvent(
    db,
    userId,
    idSchema.parse(id),
    eventSchema.partial().parse(input)
  );
  revalidateEvents();
}

export async function deleteEventAction(id: string) {
  const userId = await getDemoUserId();
  await deleteEvent(db, userId, idSchema.parse(id));
  revalidateEvents();
}
