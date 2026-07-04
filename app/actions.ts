"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { ALL_ITEM_KEYS, safeDateStr, type ItemKey } from "@/lib/prayers";

// Toggle / set a single prayer item for a given day.
export async function setItem(date: string, item: string, done: boolean) {
  const safeDate = safeDateStr(date);
  if (!ALL_ITEM_KEYS.includes(item as ItemKey)) {
    throw new Error(`Unknown prayer item: ${item}`);
  }
  db.prepare(
    `INSERT INTO prayer_log (date, item, done) VALUES (?, ?, ?)
     ON CONFLICT(date, item) DO UPDATE SET done = excluded.done`
  ).run(safeDate, item, done ? 1 : 0);

  // Refresh so server-rendered stats (streaks, calendar) reflect the change.
  refresh();
}
