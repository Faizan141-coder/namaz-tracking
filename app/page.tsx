import Link from "next/link";
import DateNav from "@/app/components/DateNav";
import DayBoard from "@/app/components/DayBoard";
import MonthCalendar from "@/app/components/MonthCalendar";
import { getDay, getDayCounts, getStats } from "@/lib/queries";
import { FARD, safeDateStr } from "@/lib/prayers";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const date = safeDateStr(rawDate);

  const day = getDay(date);
  const dayCounts = getDayCounts();
  const stats = getStats();

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Guard your prayers, day by day</p>
        </div>
      </header>

      <div className="dash">
        <section className="dash-main">
          <DateNav date={date} />
          <DayBoard key={date} date={date} initial={day} />
        </section>

        <aside className="dash-side">
          <MonthCalendar key={`cal-${date}`} dayCounts={dayCounts} selected={date} />

          <div className="card overview">
            <div className="card-head">
              <h2 className="card-title">Overview</h2>
              <Link href="/insights" className="card-link">
                Insights →
              </Link>
            </div>
            <div className="mini-grid">
              <div className="mini-tile">
                <span className="mini-num">{stats.currentStreak}🔥</span>
                <span className="mini-lbl">streak</span>
              </div>
              <div className="mini-tile">
                <span className="mini-num">{stats.bestStreak}</span>
                <span className="mini-lbl">best</span>
              </div>
              <div className="mini-tile">
                <span className="mini-num">{stats.completion30}%</span>
                <span className="mini-lbl">30-day</span>
              </div>
              <div className="mini-tile">
                <span className="mini-num">{stats.totalPrayed}</span>
                <span className="mini-lbl">total fard</span>
              </div>
            </div>

            <div className="mini-bars">
              {FARD.map((p) => {
                const n = stats.perPrayer30[p.key] ?? 0;
                const pct = Math.round((n / 30) * 100);
                return (
                  <div key={p.key} className="mb-row">
                    <span className="mb-name">{p.label}</span>
                    <div className="mb-bar">
                      <div className="mb-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mb-val">{n}/30</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
