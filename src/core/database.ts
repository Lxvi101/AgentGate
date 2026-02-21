// src/core/database.ts
import { Database } from "bun:sqlite";

export type AppDatabase = Database;

export function initDatabase(): AppDatabase {
  const db = new Database("agentgate.sqlite", { create: true });

  // Enable WAL mode for better concurrency
  db.run("PRAGMA journal_mode = WAL;");

  console.log("💿 Database initialized");

  // Run Migrations (Schema Setup)
  migrate(db);

  return db;
}

function migrate(db: Database) {
  // 1. Messages (Chat History)
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
      metadata JSON,
      parts JSON NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Notes (Long-term Memory)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note TEXT NOT NULL UNIQUE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Reminders (Cron Jobs)
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      cron TEXT NOT NULL,
      note TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_triggered DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(enabled)`);
  
  console.log("✅ Database schema verified");
}