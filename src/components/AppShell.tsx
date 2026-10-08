"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  ListPlus,
  LogOut,
  User as UserIcon,
  Wallet,
} from "@/components/icons";
import { logout } from "@/lib/actions";
import { colorStyle } from "@/lib/palette";
import { useToast } from "@/lib/providers";
import { EASE, Spinner } from "./ui";
import type { ProfileDTO } from "@/lib/types";

const NAV: {
  href: string;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { href: "/log", label: "Daily Log", mobileLabel: "Log", icon: ListPlus },
  { href: "/reports", label: "Reports", mobileLabel: "Reports", icon: BarChart3 },
  { href: "/budget", label: "Budget", mobileLabel: "Budget", icon: Wallet },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AppShell({
  children,
  profile,
  ruleName,
}: {
  children: ReactNode;
  profile: ProfileDTO;
  ruleName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleLogout() {
    setSigningOut(true);
    const result = await logout();
    if (result.ok) {
      router.push("/login");
      router.refresh();
    } else {
      setSigningOut(false);
      notify(result.error, "error");
    }
  }

  const avatarClass = colorStyle(profile.avatarColor).bar;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-500/30 transition duration-300 group-hover:scale-105 group-hover:shadow-lg">
              M
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Mudget
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {ruleName || "budget rule"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                    active ? "text-white" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-nav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 pr-2 shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[0.98]"
            >
              <span
                className={clsx(
                  "grid h-8 w-8 place-items-center rounded-xl text-xs font-bold text-white shadow-sm",
                  avatarClass,
                )}
              >
                {initials(profile.name)}
              </span>
              <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-slate-700 sm:block">
                {profile.name.split(" ")[0]}
              </span>
              <ChevronDown
                className={clsx(
                  "hidden h-4 w-4 text-slate-400 transition sm:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  role="menu"
                >
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {profile.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{profile.email}</p>
                  </div>
                  <div className="my-1 h-px bg-slate-100" />
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    role="menuitem"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    Profile & settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                    role="menuitem"
                  >
                    {signingOut ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Sign out
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 sm:pb-14 sm:pt-7">
        {children}
      </main>

      <footer className="hidden border-t border-slate-200 px-4 py-5 text-center text-[11px] text-slate-400 sm:block">
        Mudget · your budget is synced to your account — sign in from any device.
      </footer>

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/85 backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
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
                {active ? (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-x-3 top-0 h-9 rounded-2xl bg-indigo-50"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="relative">{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
