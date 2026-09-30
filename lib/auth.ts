import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { db } from "./db";

/**
 * Mock authentication layer for the MVP.
 *
 * There is no real identity provider yet: every request acts as the seeded
 * demo user. Server actions and pages call getDemoUser()/getDemoUserId()
 * so that introducing a real auth provider later only requires changing
 * this module.
 */
export async function getDemoUser() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@lifeos.app";
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    throw new Error(
      "Demo user not found. Run `npm run db:migrate && npm run db:seed` first."
    );
  }
  return user;
}

export async function getDemoUserId(): Promise<string> {
  return (await getDemoUser()).id;
}
