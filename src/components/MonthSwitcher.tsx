"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, CalendarDays } from "@/components/icons";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";
import { useApp } from "@/lib/store";
import { btnSecondary } from "./ui";

export function MonthSwitcher({ compact = false }: { compact?: boolean }) {
  const { state, setSelectedMonth, hydrated } = useApp();
  const month = state.selectedMonth;
  const isCurrent = month === currentMonth();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => setSelectedMonth(shiftMonth(month, -1))}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-[9.5rem] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <span>{hydrated ? monthLabel(month) : "…"}</span>
      </div>

      <button
        type="button"
        aria-label="Next month"
        onClick={() => setSelectedMonth(shiftMonth(month, 1))}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isCurrent && !compact ? (
        <button
          type="button"
          onClick={() => setSelectedMonth(currentMonth())}
          className={clsx(btnSecondary, "hidden whitespace-nowrap sm:inline-flex")}
        >
          This month
        </button>
      ) : null}
    </div>
  );
}
