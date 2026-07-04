"use client";

import { useState, useTransition } from "react";
import { setItem } from "@/app/actions";
import { EXTRA, FARD, FARD_KEYS, type ItemKey } from "@/lib/prayers";
import type { DayState } from "@/lib/queries";

export default function DayBoard({ date, initial }: { date: string; initial: DayState }) {
  const [state, setState] = useState<DayState>(initial);
  const [, startTransition] = useTransition();

  function toggle(item: ItemKey) {
    const next = !state[item];
    setState((s) => ({ ...s, [item]: next })); // optimistic
    startTransition(async () => {
      await setItem(date, item, next);
    });
  }

  const fardDone = FARD_KEYS.filter((k) => state[k]).length;
  const pct = (fardDone / FARD_KEYS.length) * 100;

  return (
    <section className="board">
      <div className="board-head">
        <div>
          <h2 className="board-title">Prayers</h2>
          <p className="board-sub">
            {fardDone === FARD_KEYS.length ? "All fard complete — Alhamdulillah" : `${fardDone} of 5 fard prayed`}
          </p>
        </div>
        <div className="ring" style={{ ["--pct" as string]: `${pct}%` }}>
          <span>
            {fardDone}
            <small>/5</small>
          </span>
        </div>
      </div>

      <ul className="prayer-list">
        {FARD.map((p) => (
          <li key={p.key} className="prayer-row" data-done={state[p.key] ? "" : undefined}>
            <button className="check" onClick={() => toggle(p.key)} aria-pressed={!!state[p.key]}>
              <span className="check-box" aria-hidden />
              <span className="check-labels">
                <span className="check-name">{p.label}</span>
                <span className="check-ar">{p.arabic}</span>
              </span>
            </button>
            {p.sunnah && (
              <button
                className="sunnah-chip"
                data-on={state[p.sunnah] ? "" : undefined}
                onClick={() => toggle(p.sunnah as ItemKey)}
              >
                Sunnah
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="group-label">Voluntary</h3>
      <ul className="chip-grid">
        {EXTRA.map((p) => (
          <li key={p.key}>
            <button
              className="nafl-chip"
              data-on={state[p.key] ? "" : undefined}
              onClick={() => toggle(p.key)}
            >
              <span className="nafl-name">{p.label}</span>
              <span className="nafl-hint">{p.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
