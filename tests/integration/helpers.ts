import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";
import type { DbClient } from "@/lib/db";

export interface TestContext {
  db: DbClient;
  userId: string;
  cleanup: () => void;
}

/**
 * Spins up an isolated SQLite database in a temp dir, applies all
 * migrations, and seeds a single test user. Each test file (or test)
 * gets its own database so tests never interfere with each other.
 */
export async function createTestDb(): Promise<TestContext> {
  const dir = mkdtempSync(join(tmpdir(), "lifeos-test-"));
  const sqlite = new Database(join(dir, "test.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema }) as DbClient;
  migrate(db, { migrationsFolder: "./db/migrations" });

  const [user] = await db
    .insert(schema.users)
    .values({
      id: randomUUID(),
      email: `test-${randomUUID()}@example.com`,
      name: "Test User",
    })
    .returning();

  return {
    db,
    userId: user.id,
    cleanup: () => {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
