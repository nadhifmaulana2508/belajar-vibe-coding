import { db } from "../db";

import { sql } from "drizzle-orm";

async function reset() {
  console.log("Dropping tables...");
  await db.execute(sql`DROP TABLE IF EXISTS session`);
  await db.execute(sql`DROP TABLE IF EXISTS users`);
  console.log("Tables dropped.");
  process.exit(0);
}

reset();
