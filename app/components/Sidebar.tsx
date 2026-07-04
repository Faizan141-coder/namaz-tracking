"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <path d="M8 1.5 1.5 6.5V14.5h4v-4h5v4h4V6.5L8 1.5Z" />
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <path d="M2 13.5V2.5M2 13.5H14M5 11V7M8.5 11V4.5M12 11V8.5" />
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <span className="sb-logo" aria-hidden>
          ☾
        </span>
        <span className="sb-name">
          Namaz<b>Tracker</b>
        </span>
      </div>

      <nav className="sb-nav">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sb-link"
              data-active={active ? "" : undefined}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={item.href === "/" ? "currentColor" : "none"}
                stroke={item.href === "/" ? "none" : "currentColor"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sb-foot">
        <span className="sb-dot" aria-hidden />
        Stored locally · SQLite
      </div>
    </aside>
  );
}
