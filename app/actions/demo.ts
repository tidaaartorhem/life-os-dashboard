"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/auth";
import { resetDemoData } from "@/services/misc";

/**
 * Resets the demo workspace and re-anchors all seed dates to today.
 *
 * The demo user's data is wiped and rebuilt idempotently — no other
 * user's rows are touched. Revalidates every page so the fresh dates
 * show up immediately.
 */
export async function resetDemoDataAction() {
  const user = await getDemoUser();
  const summary = await resetDemoData(db, { email: user.email });
  for (const path of ["/", "/tasks", "/goals", "/calendar", "/analytics"]) {
    revalidatePath(path);
  }
  return summary;
}
