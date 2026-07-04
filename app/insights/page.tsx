import Link from "next/link";
import { getInsights } from "@/lib/queries";
import { FARD, START_DATE } from "@/lib/prayers";

// Reads the local DB on every request so logged prayers show up immediately.
export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export default function InsightsPage() {
  const ins = getInsights();
  const lifetimePct =
    ins.possibleFard > 0 ? Math.round((ins.totalFard / ins.possibleFard) * 100) : 0;
  const maxYearFard = Math.max(1, ...ins.byYear.map((y) => y.fard));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-sub">Your salah since {START_DATE}</p>
        </div>
        <Link href="/" className="card-link">
          ← Dashboard
        </Link>
      </header>

      {/* hero: prayed vs. remaining */}
      <section className="card hero">
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-num">{fmt(ins.totalFard)}</span>
            <span className="hero-lbl">fard prayed</span>
          </div>
          <div className="hero-stat" data-warn>
            <span className="hero-num">{fmt(ins.remainingFard)}</span>
            <span className="hero-lbl">still to make up</span>
          </div>
          <div className="hero-stat">
            <span className="hero-num">{lifetimePct}%</span>
            <span className="hero-lbl">of a lifetime</span>
          </div>
        </div>
        <div className="big-bar">
          <div className="big-fill" style={{ width: `${lifetimePct}%` }} />
        </div>
        <p className="card-note">
          {fmt(ins.totalFard)} of {fmt(ins.possibleFard)} possible fard across{" "}
          {fmt(ins.daysSinceStart)} days since {START_DATE}.
        </p>
      </section>

      {/* secondary tiles */}
      <div className="tiles">
        <Tile num={fmt(ins.totalSunnah)} label="sunnah" />
        <Tile num={fmt(ins.totalNafl)} label="nafl / witr" />
        <Tile num={fmt(ins.totalAll)} label="total prayers" />
        <Tile num={fmt(ins.daysComplete)} label="perfect days" />
        <Tile num={String(ins.currentStreak)} label="current streak" />
        <Tile num={String(ins.bestStreak)} label="best streak" />
        <Tile num={fmt(ins.daysTracked)} label="days tracked" />
        <Tile num={ins.avgFardPerTrackedDay.toFixed(1)} label="avg / active day" />
      </div>

      <div className="cols2">
        {/* all-time by prayer */}
        <section className="card">
          <h2 className="card-title">All-time by prayer</h2>
          <div className="mini-bars">
            {FARD.map((p) => {
              const n = ins.byPrayer[p.key] ?? 0;
              const pct = ins.daysSinceStart > 0 ? Math.round((n / ins.daysSinceStart) * 100) : 0;
              return (
                <div key={p.key} className="mb-row">
                  <span className="mb-name">{p.label}</span>
                  <div className="mb-bar">
                    <div className="mb-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mb-val">{fmt(n)}</span>
                </div>
              );
            })}
          </div>
          <p className="card-note">Bars show completion vs. every day since {START_DATE}.</p>
        </section>

        {/* breakdown */}
        <section className="card">
          <h2 className="card-title">Day breakdown</h2>
          <ul className="kv">
            <li>
              <span>Days tracked</span>
              <b>{fmt(ins.daysTracked)}</b>
            </li>
            <li>
              <span>Perfect days (5/5)</span>
              <b>{fmt(ins.daysComplete)}</b>
            </li>
            <li>
              <span>Partial days (1–4)</span>
              <b>{fmt(ins.daysPartial)}</b>
            </li>
            <li>
              <span>Days still to log</span>
              <b>{fmt(Math.max(0, ins.daysSinceStart - ins.daysTracked))}</b>
            </li>
            <li>
              <span>Total days since start</span>
              <b>{fmt(ins.daysSinceStart)}</b>
            </li>
          </ul>
        </section>
      </div>

      {/* per-year table */}
      <section className="card">
        <h2 className="card-title">By year</h2>
        <div className="ytable">
          <div className="yrow yhead">
            <span>Year</span>
            <span className="ynum">Prayed</span>
            <span className="ynum">Left</span>
            <span className="ynum yperfect">Perfect</span>
            <span className="ybar-h">Completion</span>
            <span className="ynum">%</span>
          </div>
          {ins.byYear.map((y) => {
            const possibleFard = y.possibleDays * 5;
            const left = Math.max(0, possibleFard - y.fard);
            const pct = possibleFard > 0 ? Math.round((y.fard / possibleFard) * 100) : 0;
            const barW = Math.round((y.fard / maxYearFard) * 100);
            return (
              <div key={y.year} className="yrow">
                <span className="yyear">{y.year}</span>
                <span className="ynum">{fmt(y.fard)}</span>
                <span className="ynum yleft">{fmt(left)}</span>
                <span className="ynum yperfect">{fmt(y.completeDays)}</span>
                <span className="ybar">
                  <span className="ybar-fill" style={{ width: `${barW}%` }} />
                </span>
                <span className="ynum ypct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Tile({ num, label }: { num: string; label: string }) {
  return (
    <div className="tile">
      <span className="tile-num">{num}</span>
      <span className="tile-lbl">{label}</span>
    </div>
  );
}
