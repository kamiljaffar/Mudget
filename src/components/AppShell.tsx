"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, ListPlus, Wallet } from "@/components/icons";
import type { ReactNode } from "react";
import { monthShort } from "@/lib/format";
import { useApp } from "@/lib/store";

const NAV: {
  href: string;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { href: "/log", label: "Daily Log", mobileLabel: "Log", icon: ListPlus },
  { href: "/reports", label: "Reports", mobileLabel: "Reports", icon: BarChart3 },
  { href: "/budget", label: "Monthly Budget", mobileLabel: "Budget", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, hydrated } = useApp();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm">
              M
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Mudget
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                60 · 25 · 15 rule
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 sm:block">
            {hydrated ? monthShort(state.selectedMonth) : "—"}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:pb-12 sm:pt-7">
        {children}
      </main>

      <footer className="hidden border-t border-slate-200 px-4 py-5 text-center text-[11px] text-slate-400 sm:block">
        Mudget · data is saved locally in your browser — nothing is uploaded anywhere.
      </footer>

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition",
                  active ? "text-indigo-600" : "text-slate-400",
                )}
              >
                <span
                  className={clsx(
                    "absolute inset-x-4 top-0 h-0.5 rounded-full transition",
                    active ? "bg-indigo-600" : "bg-transparent",
                  )}
                />
                <item.icon className="h-5 w-5" />
                {item.mobileLabel ?? item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
