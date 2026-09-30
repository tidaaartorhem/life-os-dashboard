import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "../lib/db";

async function main() {
  console.log("Applying migrations from ./db/migrations ...");
  migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
