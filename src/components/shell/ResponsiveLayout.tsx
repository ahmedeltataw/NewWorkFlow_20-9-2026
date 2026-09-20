import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";
import { cx, FOCUS_RING } from "../primitives/utils";

/* ------------------------------------------------------------------ *
 * Breadcrumb
 * ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  readonly label: string;
  readonly href: string;
}

export interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
  readonly ariaLabel: string;
  readonly separatorLabel?: string;
}

export function Breadcrumb({
  items,
  ariaLabel,
  separatorLabel,
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className="py-3">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-sub-text">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-label={separatorLabel} className="inline-flex">
                  <Icon
                    name="chevron-start"
                    size="xs"
                    mirrorInRtl
                    className="text-text-placeholder"
                    aria-hidden="true"
                  />
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="text-text-primary font-semibold">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cx(
                    "transition-colors hover:text-text-primary",
                    FOCUS_RING,
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * Container — responsive max-width wrapper
 * ------------------------------------------------------------------ */

export interface ContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: "div" | "main" | "section";
  readonly ariaLabel?: string;
}

export function Container({
  children,
  className,
  as: Tag = "div",
  ariaLabel,
}: ContainerProps) {
  return (
    <Tag
      aria-label={ariaLabel}
      className={cx("mx-auto w-full max-w-[1320px] px-4 md:px-6", className)}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * ResponsiveGrid — column-count grid driven by Tailwind breakpoints
 *
 *  sm (<md):  1 column, 16px gutter
 *  md:        2 columns, 24px gutter
 *  lg:        3 columns, 24px gutter
 *  xl:        4 columns, 24px gutter
 * ------------------------------------------------------------------ */

export interface ResponsiveGridProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TwoColumnLayout — 60/40 split for auction detail at lg+
 * ------------------------------------------------------------------ */

export interface TwoColumnLayoutProps {
  readonly main: ReactNode;
  readonly sidebar: ReactNode;
  readonly className?: string;
}

export function TwoColumnLayout({
  main,
  sidebar,
  className,
}: TwoColumnLayoutProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-6 lg:flex-row",
        className,
      )}
    >
      <div className="flex-1 lg:w-[60%]">{main}</div>
      <div className="lg:w-[40%] lg:sticky lg:top-4 lg:self-start">
        {sidebar}
      </div>
    </div>
  );
}
