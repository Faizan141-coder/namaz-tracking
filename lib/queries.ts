import "server-only";
import { db } from "@/lib/db";
import { FARD_KEYS, START_DATE, addDays, parseDateStr, todayStr } from "@/lib/prayers";

// Map of item -> done for a single day.
export type DayState = Record<string, boolean>;

export function getDay(date: string): DayState {
  const rows = db
    .prepare("SELECT item, done FROM prayer_log WHERE date = ?")
    .all(date) as { item: string; done: number }[];
  const state: DayState = {};
  for (const r of rows) state[r.item] = r.done === 1;
  return state;
}

// date -> number of fard prayers (0..5) logged that day, for the calendar.
export function getDayCounts(): Record<string, number> {
  const rows = db
    .prepare(
      `SELECT date, COUNT(*) AS n FROM prayer_log
       WHERE done = 1 AND item IN ('fajr','dhuhr','asr','maghrib','isha')
       GROUP BY date`
    )
    .all() as { date: string; n: number }[];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.date] = r.n;
  return map;
}

export type Stats = {
  currentStreak: number;
  bestStreak: number;
  completion30: number; // % of fard prayed over the last 30 days
  perPrayer30: Record<string, number>; // fard key -> count in last 30 days
  totalPrayed: number; // all-time fard prayed
};

export function getStats(): Stats {
  const fardSet = new Set<string>(FARD_KEYS);

  // date -> number of fard prayers done that day
  const rows = db
    .prepare(
      `SELECT date, item FROM prayer_log
       WHERE done = 1 AND item IN ('fajr','dhuhr','asr','maghrib','isha')`
    )
    .all() as { date: string; item: string }[];

  const fardByDate = new Map<string, number>();
  let totalPrayed = 0;
  for (const r of rows) {
    if (!fardSet.has(r.item)) continue;
    fardByDate.set(r.date, (fardByDate.get(r.date) ?? 0) + 1);
    totalPrayed++;
  }

  const isComplete = (date: string) => (fardByDate.get(date) ?? 0) === FARD_KEYS.length;

  // Current streak: consecutive complete days ending today (today itself is a
  // grace day — an unfinished today does not break the streak yet).
  const today = todayStr();
  let currentStreak = 0;
  let cursor = today;
  if (!isComplete(today)) cursor = addDays(today, -1);
  while (isComplete(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  // Best streak: longest run of consecutive complete days, all time.
  const completeDays = [...fardByDate.keys()].filter(isComplete).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of completeDays) {
    if (prev !== null && addDays(prev, 1) === d) {
      run++;
    } else {
      run = 1;
    }
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  // Last-30-days figures.
  const perPrayer30: Record<string, number> = {};
  for (const k of FARD_KEYS) perPrayer30[k] = 0;
  let done30 = 0;
  const last30 = new Set<string>();
  for (let i = 0; i < 30; i++) last30.add(addDays(today, -i));

  const detailRows = db
    .prepare(
      `SELECT date, item FROM prayer_log
       WHERE done = 1 AND item IN ('fajr','dhuhr','asr','maghrib','isha')`
    )
    .all() as { date: string; item: string }[];
  for (const r of detailRows) {
    if (!last30.has(r.date)) continue;
    perPrayer30[r.item] = (perPrayer30[r.item] ?? 0) + 1;
    done30++;
  }
  const completion30 = Math.round((done30 / (30 * FARD_KEYS.length)) * 100);

  return {
    currentStreak,
    bestStreak,
    completion30,
    perPrayer30,
    totalPrayed,
  };
}

// ---- Deep insights (lifetime, per-year, per-day) ----

const SUNNAH_ITEMS = ["sunnah_fajr", "sunnah_dhuhr", "sunnah_maghrib", "sunnah_isha"];
const NAFL_ITEMS = ["witr", "tahajjud", "duha"];

// Inclusive number of days between two YYYY-MM-DD strings.
function daysBetween(a: string, b: string): number {
  const ta = parseDateStr(a).getTime();
  const tb = parseDateStr(b).getTime();
  return Math.round((tb - ta) / 86_400_000) + 1;
}

export type YearStat = {
  year: number;
  fard: number; // fard prayed that year
  completeDays: number; // days with all 5 fard
  possibleDays: number; // days in [start, today] falling in this year
};

export type Insights = {
  totalFard: number;
  totalSunnah: number;
  totalNafl: number;
  totalAll: number;
  byPrayer: Record<string, number>; // fard key -> all-time count
  daysComplete: number; // days with 5/5 fard
  daysPartial: number; // days with 1..4 fard
  daysTracked: number; // days with at least one fard logged
  daysSinceStart: number; // calendar days from START_DATE to today
  possibleFard: number; // daysSinceStart * 5
  remainingFard: number; // possibleFard - totalFard (backlog still to log/make up)
  avgFardPerTrackedDay: number;
  currentStreak: number;
  bestStreak: number;
  byYear: YearStat[]; // newest year first
};

export function getInsights(): Insights {
  const rows = db
    .prepare("SELECT date, item FROM prayer_log WHERE done = 1")
    .all() as { date: string; item: string }[];

  const fard = new Set<string>(FARD_KEYS);
  const sunnah = new Set(SUNNAH_ITEMS);
  const nafl = new Set(NAFL_ITEMS);

  let totalFard = 0;
  let totalSunnah = 0;
  let totalNafl = 0;
  const byPrayer: Record<string, number> = {};
  for (const k of FARD_KEYS) byPrayer[k] = 0;
  const fardByDate = new Map<string, number>();

  for (const r of rows) {
    if (fard.has(r.item)) {
      totalFard++;
      byPrayer[r.item]++;
      fardByDate.set(r.date, (fardByDate.get(r.date) ?? 0) + 1);
    } else if (sunnah.has(r.item)) {
      totalSunnah++;
    } else if (nafl.has(r.item)) {
      totalNafl++;
    }
  }

  const today = todayStr();
  const isComplete = (d: string) => (fardByDate.get(d) ?? 0) === FARD_KEYS.length;

  // Streaks.
  let currentStreak = 0;
  let cursor = today;
  if (!isComplete(today)) cursor = addDays(today, -1);
  while (isComplete(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }
  const completeDays = [...fardByDate.keys()].filter(isComplete).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of completeDays) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  const daysComplete = completeDays.length;
  const daysTracked = fardByDate.size;
  const daysPartial = daysTracked - daysComplete;
  const daysSinceStart = daysBetween(START_DATE, today);
  const avgFardPerTrackedDay = daysTracked ? totalFard / daysTracked : 0;

  // Per-year breakdown.
  const startYear = parseDateStr(START_DATE).getFullYear();
  const endYear = parseDateStr(today).getFullYear();
  const yearAgg = new Map<number, { fard: number; complete: number }>();
  for (const [d, count] of fardByDate) {
    const y = Number(d.slice(0, 4));
    const e = yearAgg.get(y) ?? { fard: 0, complete: 0 };
    e.fard += count;
    if (count === FARD_KEYS.length) e.complete++;
    yearAgg.set(y, e);
  }
  const byYear: YearStat[] = [];
  for (let y = endYear; y >= startYear; y--) {
    const s = y === startYear ? START_DATE : `${y}-01-01`;
    const e = y === endYear ? today : `${y}-12-31`;
    const agg = yearAgg.get(y) ?? { fard: 0, complete: 0 };
    byYear.push({
      year: y,
      fard: agg.fard,
      completeDays: agg.complete,
      possibleDays: daysBetween(s, e),
    });
  }

  const possibleFard = daysSinceStart * FARD_KEYS.length;

  return {
    totalFard,
    totalSunnah,
    totalNafl,
    totalAll: totalFard + totalSunnah + totalNafl,
    byPrayer,
    daysComplete,
    daysPartial,
    daysTracked,
    daysSinceStart,
    possibleFard,
    remainingFard: Math.max(0, possibleFard - totalFard),
    avgFardPerTrackedDay,
    currentStreak,
    bestStreak,
    byYear,
  };
}
