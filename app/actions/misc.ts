"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { idSchema } from "@/lib/validations";
import {
  createTransaction,
  deleteTransaction,
  createNote,
  deleteNote,
  createFocusSession,
} from "@/services/misc";

const transactionSchema = z.object({
  amount: z.number().finite(),
  category: z.string().min(1).max(40),
  description: z.string().max(200).default(""),
  date: z.string().date(),
});

const noteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
});

const focusSchema = z.object({
  durationMinutes: z.number().int().min(1).max(480),
  startedAt: z.string().datetime(),
});

export async function createTransactionAction(input: unknown) {
  const userId = await getDemoUserId();
  const tx = await createTransaction(
    db,
    userId,
    transactionSchema.parse(input)
  );
  revalidatePath("/");
  revalidatePath("/analytics");
  return tx;
}

export async function deleteTransactionAction(id: string) {
  const userId = await getDemoUserId();
  await deleteTransaction(db, userId, idSchema.parse(id));
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createNoteAction(input: unknown) {
  const userId = await getDemoUserId();
  const note = await createNote(db, userId, noteSchema.parse(input));
  revalidatePath("/");
  return note;
}

export async function deleteNoteAction(id: string) {
  const userId = await getDemoUserId();
  await deleteNote(db, userId, idSchema.parse(id));
  revalidatePath("/");
}

export async function createFocusSessionAction(input: unknown) {
  const userId = await getDemoUserId();
  const session = await createFocusSession(
    db,
    userId,
    focusSchema.parse(input)
  );
  revalidatePath("/");
  revalidatePath("/analytics");
  return session;
}
