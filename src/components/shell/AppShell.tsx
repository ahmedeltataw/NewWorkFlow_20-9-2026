"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { TabBar } from "./TabBar";

export interface AppShellLabels {
  readonly appName: string;
  readonly home: string;
  readonly auctions: string;
  readonly wallet: string;
  readonly profile: string;
  readonly search: string;
  readonly language: string;
  readonly languageToggle: string;
  readonly notifications: string;
}

export interface AppShellProps {
  readonly children: ReactNode;
  readonly labels: AppShellLabels;
}

export function AppShell({ children, labels }: AppShellProps) {
  const currentPath = usePathname();
  const tabItems = [
    { label: labels.home, href: "/", icon: "home" },
    { label: labels.auctions, href: "/auctions", icon: "auctions" },
    { label: labels.wallet, href: "/wallet", icon: "wallet" },
    { label: labels.profile, href: "/profile", icon: "profile" },
  ] as const;
  const isActivePath = (href: string) =>
    href === "/"
      ? currentPath === href
      : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <>
      <SiteHeader
        appName={labels.appName}
        navItems={tabItems.slice(0, 2).map(({ label, href }) => ({
          label,
          href,
          active: isActivePath(href),
        }))}
        searchLabel={labels.search}
        languageLabel={labels.language}
        languageToggleLabel={labels.languageToggle}
        notificationsLabel={labels.notifications}
        walletLabel={labels.wallet}
        profileLabel={labels.profile}
      />
      <div className="pb-16 md:pb-0">{children}</div>
      <TabBar
        items={tabItems}
        currentPath={
          tabItems.find((item) => isActivePath(item.href))?.href ?? ""
        }
        ariaLabel={labels.appName}
      />
    </>
  );
}
