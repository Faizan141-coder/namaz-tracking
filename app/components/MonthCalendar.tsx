"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { START_DATE, parseDateStr, todayStr } from "@/lib/prayers";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// count of fard (0..5) -> colour bucket
function level(count: number): number {
  if (count <= 0) return 0;
  return Math.min(5, count);
}

export default function MonthCalendar({
  dayCounts,
  selected,
}: {
  dayCounts: Record<string, number>;
  selected: string;
}) {
  const today = todayStr();
  const start = parseDateStr(START_DATE);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const todayD = parseDateStr(today);
  const todayYear = todayD.getFullYear();
  const todayMonth = todayD.getMonth();

  const sel = parseDateStr(selected);
  const [year, setYear] = useState(sel.getFullYear());
  const [month, setMonth] = useState(sel.getMonth());

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const atStart = year === startYear && month === startMonth;
  const atEnd = year === todayYear && month === todayMonth;

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    if (y < startYear || (y === startYear && m < startMonth)) return;
    if (y > todayYear || (y === todayYear && m > todayMonth)) return;
    setYear(y);
    setMonth(m);
  }

  function jumpYear(y: number) {
    let m = month;
    if (y === startYear && m < startMonth) m = startMonth;
    if (y === todayYear && m > todayMonth) m = todayMonth;
    setYear(y);
    setMonth(m);
  }

  function openDay(dateStr: string) {
    startTransition(() => {
      router.push(dateStr === today ? "/" : `/?date=${dateStr}`);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);

  const years: number[] = [];
  for (let y = startYear; y <= todayYear; y++) years.push(y);

  return (
    <section className="cal" data-pending={isPending ? "" : undefined}>
      <div className="cal-head">
        <button className="navbtn" onClick={() => shift(-1)} disabled={atStart} aria-label="Previous month">
          ‹
        </button>
        <div className="cal-title">
          <span className="cal-month">{MONTHS[month]}</span>
          <select
            className="cal-year"
            value={year}
            onChange={(e) => jumpYear(Number(e.target.value))}
            aria-label="Jump to year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button className="navbtn" onClick={() => shift(1)} disabled={atEnd} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cal-grid cal-week">
        {WEEK.map((w, i) => (
          <span key={i} className="cal-wd">
            {w}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <span key={`b${i}`} className="cal-blank" />;
          const disabled = dateStr < START_DATE || dateStr > today;
          const count = dayCounts[dateStr] ?? 0;
          const day = Number(dateStr.slice(8));
          return (
            <button
              key={dateStr}
              className="cal-day"
              data-level={level(count)}
              data-disabled={disabled ? "" : undefined}
              data-selected={dateStr === selected ? "" : undefined}
              data-today={dateStr === today ? "" : undefined}
              data-empty={!disabled && count === 0 ? "" : undefined}
              disabled={disabled}
              onClick={() => openDay(dateStr)}
              title={disabled ? undefined : `${dateStr} — ${count}/5 fard`}
            >
              <span className="cal-num">{day}</span>
              {count > 0 && <span className="cal-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <p className="cal-hint">Tap any day to open it and mark your prayers.</p>
    </section>
  );
}
