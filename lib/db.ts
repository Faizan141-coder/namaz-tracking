import "server-only";
import Database from "better-sqlite3";
import path from "node:path";

// A single shared connection for the process. In dev, Next.js hot-reload can
// re-evaluate this module, so we cache the connection on globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __namazDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const file = path.join(process.cwd(), "namaz.db");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS prayer_log (
      date TEXT    NOT NULL,
      item TEXT    NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, item)
    );
  `);

  return db;
}

export const db: Database.Database = globalThis.__namazDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__namazDb = db;
}
