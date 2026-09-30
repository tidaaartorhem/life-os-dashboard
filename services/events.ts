import { and, asc, eq, gte, lte } from "drizzle-orm";
import { calendarEvents } from "@/db/schema";
import type { DbClient } from "@/lib/db";
import type { EventInput } from "@/lib/validations";
import type { CalendarEvent } from "@/types";

export async function listEvents(
  client: DbClient,
  userId: string,
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  return client.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, userId),
      gte(calendarEvents.startsAt, from),
      lte(calendarEvents.startsAt, to)
    ),
    orderBy: [asc(calendarEvents.startsAt)],
  });
}

export async function createEvent(
  client: DbClient,
  userId: string,
  input: EventInput
) {
  if (input.endsAt < input.startsAt) {
    throw new Error("Event end must be after its start");
  }
  const [row] = await client
    .insert(calendarEvents)
    .values({
      title: input.title,
      description: input.description?.trim() ? input.description : null,
      location: input.location?.trim() ? input.location : null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allDay: input.allDay,
      userId,
    })
    .returning();
  return row;
}

export async function updateEvent(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<EventInput>
) {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined)
    patch.description = input.description?.trim() ? input.description : null;
  if (input.location !== undefined)
    patch.location = input.location?.trim() ? input.location : null;
  if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt;
  if (input.allDay !== undefined) patch.allDay = input.allDay;
  await client
    .update(calendarEvents)
    .set(patch)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}

export async function deleteEvent(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}
