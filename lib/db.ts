import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

/**
 * Local development uses SQLite (better-sqlite3) so the app runs with zero
 * external services. To run on PostgreSQL in production, swap this module
 * for a postgres-js / neon driver — e.g.:
 *
 *   import { drizzle } from "drizzle-orm/postgres-js";
 *   import postgres from "postgres";
 *   export const db = drizzle(postgres(process.env.DATABASE_URL!), { schema });
 *
 * and generate Postgres migrations with `drizzle-kit generate --dialect=postgresql`.
 * All data access lives in /services, so no other code changes are needed.
 */
function databasePath(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

const globalForDb = globalThis as unknown as {
  __lifeos_db?: BetterSQLite3Database<typeof schema>;
};

function createDb() {
  const sqlite = new Database(databasePath());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db: BetterSQLite3Database<typeof schema> =
  globalForDb.__lifeos_db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__lifeos_db = db;
}

export type DbClient = typeof db;
