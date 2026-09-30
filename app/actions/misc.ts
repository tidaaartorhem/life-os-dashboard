"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import {
  transactionSchema,
  noteSchema,
} from "@/lib/validations";
import {
  createTransaction,
  deleteTransaction,
  createNote,
  deleteNote,
  createFocusSession,
} from "@/services/misc";

const idSchema = z.string().min(1);
const focusSchema = z.object({
  label: z.string().max(200).nullish(),
  minutes: z.coerce.number().int().min(1).max(1440),
  date: z.coerce.date(),
});

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createTransactionAction(input: unknown) {
  const userId = await getDemoUserId();
  const tx = await createTransaction(
    db,
    userId,
    transactionSchema.parse(input)
  );
  revalidateFinance();
  return tx;
}

export async function deleteTransactionAction(id: string) {
  const userId = await getDemoUserId();
  await deleteTransaction(db, userId, idSchema.parse(id));
  revalidateFinance();
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
  revalidateFinance();
  return session;
}
