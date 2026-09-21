"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "../primitives/Icon";
import { cx, FOCUS_RING } from "../primitives/utils";
import { LanguageToggle } from "./LanguageToggle";

export type SiteHeaderVariant = "full" | "compact";

export interface SiteHeaderNavItem {
  readonly label: string;
  readonly href: string;
  readonly active?: boolean;
}

export interface SiteHeaderProps {
  readonly variant?: SiteHeaderVariant;
  readonly appName: string;
  readonly backLabel?: string;
  readonly onBack?: () => void;
  readonly navItems?: readonly SiteHeaderNavItem[];
  readonly searchLabel?: string;
  readonly languageLabel?: string;
  readonly languageToggleLabel?: string;
  readonly notificationsLabel?: string;
  readonly walletLabel?: string;
  readonly profileLabel?: string;
  readonly logo?: ReactNode;
  readonly actions?: ReactNode;
}

export function SiteHeader({
  variant = "full",
  appName,
  backLabel,
  onBack,
  navItems = [],
  searchLabel,
  languageLabel,
  languageToggleLabel,
  notificationsLabel,
  walletLabel,
  profileLabel,
  logo,
  actions,
}: SiteHeaderProps) {
  if (variant === "compact") {
    return (
      <header
        role="banner"
        className="flex items-center gap-3 border-b border-stroke-light bg-surface-white-bg px-4 py-3 md:hidden"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className={cx(
              "inline-flex items-center justify-center ps-1 pe-2",
              FOCUS_RING,
            )}
          >
            <Icon name="chevron-start" size="md" mirrorInRtl />
          </button>
        )}
        <h1 className="text-h3 text-text-primary truncate">{appName}</h1>
        {actions}
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="hidden border-b border-stroke-light bg-surface-white-bg md:block"
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-2 px-3 lg:gap-6 lg:px-6">
        <Link href="/" className="shrink-0 text-h3 text-text-primary">
          {logo ?? appName}
        </Link>

        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-0 lg:gap-1"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cx(
                "whitespace-nowrap px-2 py-2 text-label rounded-md transition-colors lg:px-3",
                item.active
                  ? "text-action-primary bg-surface-card-primary-bg"
                  : "text-text-primary hover:bg-surface-on-background",
                FOCUS_RING,
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        {searchLabel && (
          <div className="relative">
            <Icon
              name="search"
              size="sm"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-text-placeholder"
            />
            <input
              type="search"
              placeholder={searchLabel}
              aria-label={searchLabel}
              className={cx(
                "h-9 w-28 rounded-full border border-stroke-heavy bg-surface-white-bg ps-4 pe-9 text-body-sm text-text-primary placeholder:text-text-placeholder lg:w-48",
                FOCUS_RING,
              )}
            />
          </div>
        )}

        {languageLabel && languageToggleLabel && (
          <LanguageToggle
            label={languageLabel}
            nextLanguageLabel={languageToggleLabel}
          />
        )}

        {notificationsLabel && (
          <a
            href="/notifications"
            aria-label={notificationsLabel}
            className={cx(
              "inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors hover:bg-surface-on-background",
              FOCUS_RING,
            )}
          >
            <Icon name="eye" size="md" />
          </a>
        )}

        {walletLabel && (
          <a
            href="/wallet"
            aria-label={walletLabel}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border border-stroke-heavy px-3 py-1.5 text-label transition-colors hover:bg-surface-on-background",
              FOCUS_RING,
            )}
          >
            <Icon name="eye" size="sm" />
            <span>{walletLabel}</span>
          </a>
        )}

        {profileLabel && (
          <a
            href="/profile"
            aria-label={profileLabel}
            className={cx(
              "inline-flex items-center justify-center h-9 w-9 rounded-full bg-action-primary text-text-white text-label transition-opacity hover:opacity-90",
              FOCUS_RING,
            )}
          >
            {profileLabel.charAt(0)}
          </a>
        )}

        {actions}
      </div>
    </header>
  );
}
