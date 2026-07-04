// Prayer configuration, item keys, and date helpers shared across the app.

// Every trackable item stored in the `prayer_log` table uses one of these keys.
export type ItemKey =
  // fard (obligatory)
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  // extra / nafl
  | "tahajjud"
  | "witr"
  | "duha"
  // sunnah attached to a fard prayer
  | "sunnah_fajr"
  | "sunnah_dhuhr"
  | "sunnah_maghrib"
  | "sunnah_isha";

// The five obligatory prayers. A day is "complete" when all five are done.
export const FARD_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type FardKey = (typeof FARD_KEYS)[number];

// Fard prayers, each optionally paired with its sunnah rak'ah item.
export const FARD: {
  key: FardKey;
  label: string;
  arabic: string;
  sunnah: ItemKey | null;
}[] = [
  { key: "fajr", label: "Fajr", arabic: "الفجر", sunnah: "sunnah_fajr" },
  { key: "dhuhr", label: "Dhuhr", arabic: "الظهر", sunnah: "sunnah_dhuhr" },
  { key: "asr", label: "Asr", arabic: "العصر", sunnah: null },
  { key: "maghrib", label: "Maghrib", arabic: "المغرب", sunnah: "sunnah_maghrib" },
  { key: "isha", label: "Isha", arabic: "العشاء", sunnah: "sunnah_isha" },
];

// Voluntary prayers tracked separately from the fard.
export const EXTRA: { key: ItemKey; label: string; arabic: string; hint: string }[] = [
  { key: "witr", label: "Witr", arabic: "الوتر", hint: "after Isha" },
  { key: "tahajjud", label: "Tahajjud", arabic: "التهجد", hint: "late night" },
  { key: "duha", label: "Duha", arabic: "الضحى", hint: "forenoon" },
];

// Every item key that exists, for validation of untrusted action input.
export const ALL_ITEM_KEYS: ItemKey[] = [
  ...FARD.map((p) => p.key),
  ...FARD.map((p) => p.sunnah).filter((s): s is ItemKey => s !== null),
  ...EXTRA.map((p) => p.key),
];

// The earliest day the calendar allows — the start of a lifetime of salah.
export const START_DATE = "2009-05-30";

// ---- Date helpers (local time, YYYY-MM-DD) ----

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

// Parse a YYYY-MM-DD string into a local Date at midnight.
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Validate a date string and clamp it to [START_DATE, today]; fall back to
// today if malformed.
export function safeDateStr(s: string | undefined | null): string {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parseDateStr(s);
    if (!Number.isNaN(d.getTime())) {
      if (s < START_DATE) return START_DATE;
      const today = todayStr();
      if (s > today) return today;
      return s;
    }
  }
  return todayStr();
}

export function addDays(s: string, delta: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Human-friendly label, e.g. "Today · Sat, 5 Jul 2026".
export function prettyDate(s: string): string {
  const d = parseDateStr(s);
  const weekday = WEEKDAYS[d.getDay()].slice(0, 3);
  const label = `${weekday}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  const today = todayStr();
  if (s === today) return `Today · ${label}`;
  if (s === addDays(today, -1)) return `Yesterday · ${label}`;
  return label;
}
