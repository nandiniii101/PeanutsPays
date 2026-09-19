import { db } from "./client";
import { sql } from "drizzle-orm";

let initialized = false;

export async function ensureTablesExist() {
  if (initialized) return;

  try {
    const tableInfo = await db.run(sql`PRAGMA table_info(users)`);
    const cols = (tableInfo.rows || []).map((r: Record<string, unknown>) => r.name || r[1]);
    if (cols.length > 0 && !cols.includes("password_hash")) {
      await db.run(sql`DROP TABLE IF EXISTS users`);
    }
  } catch {
    // Proceed to create tables
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      date TEXT NOT NULL DEFAULT (current_timestamp)
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id)
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id)
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS lending_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      friend_id TEXT NOT NULL REFERENCES friends(id),
      amount REAL NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('lent', 'borrowed')),
      note TEXT,
      date TEXT NOT NULL DEFAULT (current_timestamp),
      settled INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS lending_entries_user_id_idx ON lending_entries(user_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS lending_entries_friend_id_idx ON lending_entries(friend_id)
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS budget_limits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (current_timestamp)
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS budget_limits_user_id_idx ON budget_limits(user_id)
  `);
  await db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS budget_limits_user_cat_idx ON budget_limits(user_id, category)
  `);

  initialized = true;
}
