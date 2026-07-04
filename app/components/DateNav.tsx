"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { START_DATE, addDays, prettyDate, todayStr } from "@/lib/prayers";

export default function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = todayStr();
  const isFuture = date >= today; // block navigating past today
  const atStart = date <= START_DATE; // block navigating before the lifetime start

  function go(next: string) {
    startTransition(() => {
      router.push(next === today ? "/" : `/?date=${next}`);
    });
  }

  return (
    <div className="datenav" data-pending={isPending ? "" : undefined}>
      <button
        className="navbtn"
        onClick={() => go(addDays(date, -1))}
        disabled={atStart}
        aria-label="Previous day"
      >
        ‹
      </button>

      <div className="datelabel">
        <span className="dateline">{prettyDate(date)}</span>
        <input
          className="dateinput"
          type="date"
          value={date}
          min={START_DATE}
          max={today}
          onChange={(e) => e.target.value && go(e.target.value)}
        />
      </div>

      <button
        className="navbtn"
        onClick={() => go(addDays(date, 1))}
        disabled={isFuture}
        aria-label="Next day"
      >
        ›
      </button>

      {date !== today && (
        <button className="todaybtn" onClick={() => go(today)}>
          Today
        </button>
      )}
    </div>
  );
}
