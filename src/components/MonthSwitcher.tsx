"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, CalendarDays } from "@/components/icons";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";
import { useMonth } from "@/lib/providers";
import { btnSecondary } from "./ui";

export function MonthSwitcher({ compact = false }: { compact?: boolean }) {
  const { month, setMonth } = useMonth();
  const isCurrent = month === currentMonth();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => setMonth(shiftMonth(month, -1))}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-[9.5rem] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
        <CalendarDays className="h-4 w-4 text-indigo-500" />
        <span>{monthLabel(month)}</span>
      </div>

      <button
        type="button"
        aria-label="Next month"
        onClick={() => setMonth(shiftMonth(month, 1))}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isCurrent && !compact ? (
        <button
          type="button"
          onClick={() => setMonth(currentMonth())}
          className={clsx(btnSecondary, "hidden whitespace-nowrap sm:inline-flex")}
        >
          This month
        </button>
      ) : null}
    </div>
  );
}
