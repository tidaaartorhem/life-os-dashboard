import { and, asc, desc, eq, gte } from "drizzle-orm";
import {
  focusSessions,
  notes,
  projects,
  tags,
  transactions,
} from "@/db/schema";
import type { DbClient } from "@/lib/db";
import type {
  NoteInput,
  ProjectInput,
  TagInput,
  TransactionInput,
} from "@/lib/validations";

// ---------- Projects ----------

export async function listProjects(client: DbClient, userId: string) {
  return client.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [asc(projects.name)],
  });
}

export async function createProject(
  client: DbClient,
  userId: string,
  input: ProjectInput
) {
  const [row] = await client
    .insert(projects)
    .values({ name: input.name, color: input.color, userId })
    .returning();
  return row;
}

export async function deleteProject(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ---------- Tags ----------

export async function listTags(client: DbClient, userId: string) {
  return client.query.tags.findMany({
    where: eq(tags.userId, userId),
    orderBy: [asc(tags.name)],
  });
}

export async function createTag(client: DbClient, userId: string, input: TagInput) {
  const [row] = await client
    .insert(tags)
    .values({ name: input.name, color: input.color, userId })
    .returning();
  return row;
}

export async function deleteTag(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)));
}

// ---------- Notes (quick capture) ----------

export async function listNotes(client: DbClient, userId: string, limit = 20) {
  return client.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.updatedAt)],
    limit,
  });
}

export async function createNote(
  client: DbClient,
  userId: string,
  input: NoteInput
) {
  const [row] = await client
    .insert(notes)
    .values({ title: input.title, body: input.body, userId })
    .returning();
  return row;
}

export async function updateNote(
  client: DbClient,
  userId: string,
  id: string,
  input: Partial<NoteInput>
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  await client
    .update(notes)
    .set(patch)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

export async function deleteNote(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}

// ---------- Transactions ----------

export async function listTransactions(
  client: DbClient,
  userId: string,
  from?: Date,
  limit = 100
) {
  return client.query.transactions.findMany({
    where: from
      ? and(eq(transactions.userId, userId), gte(transactions.date, from))
      : eq(transactions.userId, userId),
    orderBy: [desc(transactions.date)],
    limit,
  });
}

export async function createTransaction(
  client: DbClient,
  userId: string,
  input: TransactionInput
) {
  const [row] = await client
    .insert(transactions)
    .values({
      label: input.label,
      amount: input.amount,
      category: input.category,
      date: input.date,
      kind: input.kind,
      userId,
    })
    .returning();
  return row;
}

export async function deleteTransaction(
  client: DbClient,
  userId: string,
  id: string
): Promise<void> {
  await client
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// ---------- Focus sessions ----------

export async function listFocusSessions(client: DbClient, userId: string, from?: Date) {
  return client.query.focusSessions.findMany({
    where: from
      ? and(eq(focusSessions.userId, userId), gte(focusSessions.date, from))
      : eq(focusSessions.userId, userId),
    orderBy: [desc(focusSessions.date)],
    limit: 100,
  });
}

export async function createFocusSession(
  client: DbClient,
  userId: string,
  input: { label?: string | null; minutes: number; date: Date }
) {
  const [row] = await client
    .insert(focusSessions)
    .values({
      label: input.label?.trim() ? input.label : null,
      minutes: input.minutes,
      date: input.date,
      userId,
    })
    .returning();
  return row;
}
