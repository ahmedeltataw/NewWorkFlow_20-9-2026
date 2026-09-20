"use client";

import { cx, FOCUS_RING } from "../primitives/utils";

export interface TabBarItem {
  readonly label: string;
  readonly href: string;
  readonly icon: "home" | "auctions" | "wallet" | "profile";
}

export interface TabBarProps {
  readonly items: readonly TabBarItem[];
  readonly currentPath: string;
  readonly ariaLabel: string;
}

function TabIcon({
  name,
  active,
}: {
  readonly name: TabBarItem["icon"];
  readonly active: boolean;
}) {
  const className = "h-6 w-6";
  const stroke = active ? "currentColor" : "none";
  const fill = active ? "currentColor" : "none";

  switch (name) {
    case "home":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill={fill}
          stroke={stroke}
          strokeWidth={active ? 0 : 1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      );
    case "auctions":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M14.5 2l4.5 4.5L12 13.5 6 9l8.5-7z" />
          <path d="M3 21h18" />
          <path d="M7 17l-3 4" />
          <path d="M17 17l3 4" />
        </svg>
      );
    case "wallet":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M16 14h2" />
        </svg>
      );
    case "profile":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0112 0v1" />
        </svg>
      );
  }
}

export function TabBar({ items, currentPath, ariaLabel }: TabBarProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stroke-light bg-surface-white-bg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex items-stretch" role="list">
        {items.map((item) => {
          const active = currentPath === item.href;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 py-2 text-micro transition-colors",
                  active
                    ? "text-action-primary"
                    : "text-text-sub-text hover:text-text-primary",
                  FOCUS_RING,
                )}
              >
                <TabIcon name={item.icon} active={active} />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
