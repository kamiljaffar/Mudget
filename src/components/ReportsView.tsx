"use client";

import { useMemo, useState } from "react";
import { BarChart3, PackageSearch, Search } from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
  btnSecondary,
  inputClass,
} from "@/components/ui";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { categoryStats, dailySeries, itemStats, monthSummary } from "@/lib/calc";
import { formatMoney, percentOf } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { CategoryId } from "@/lib/types";

type Filter = "all" | CategoryId;

export function ReportsView() {
  const { state, hydrated } = useApp();
  const month = state.selectedMonth;
  const currency = state.currency;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const summary = monthSummary(state, month);
  const stats = categoryStats(state, month);
  const allItems = useMemo(() => itemStats(state, month), [state, month]);
  const series = useMemo(() => dailySeries(state, month), [state, month]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesFilter = filter === "all" || item.category === filter;
      const matchesQuery =
        !q || item.name.toLowerCase().includes(q) || CATEGORY_MAP[item.category].label.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [allItems, query, filter]);

  const maxDay = Math.max(...series.map((p) => p.total), 1);
  const maxItem = Math.max(...items.map((i) => i.total), 1);

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Reports"
        subtitle="Cost per item — see how much the same thing cost you this month"
      >
        <MonthSwitcher />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total spent"
          value={formatMoney(summary.spent, currency)}
          accent="text-rose-600"
        />
        <StatCard label="Purchases" value={String(summary.transactionCount)} hint="transactions" />
        <StatCard label="Unique items" value={String(summary.uniqueItems)} hint="different names" />
        <StatCard
          label="Avg per purchase"
          value={formatMoney(
            summary.transactionCount ? summary.spent / summary.transactionCount : 0,
            currency,
          )}
          hint={`Across ${summary.daysTotal} days`}
        />
      </div>

      {/* category split */}
      <Card>
        <CardHeader
          title="Category breakdown"
          subtitle="Share of spending against the 60/25/15 limits"
        />
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {stats.map((s) => {
            const share = percentOf(s.spent, summary.spent);
            return share > 0 ? (
              <div
                key={s.info.id}
                className={`${s.info.bar} h-full`}
                style={{ width: `${share}%` }}
                title={`${s.info.label}: ${share.toFixed(0)}%`}
              />
            ) : null;
          })}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.info.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${s.info.text}`}>{s.info.label}</span>
                <Chip className={s.info.chip}>{s.info.percent}%</Chip>
              </div>
              <p className="mt-1.5 text-sm font-bold text-slate-900">
                {formatMoney(s.spent, currency)}
              </p>
              <p className="text-[11px] text-slate-500">
                {Math.round(percentOf(s.spent, summary.spent))}% of spending ·{" "}
                {formatMoney(s.remaining, currency)} left of {formatMoney(s.limit, currency)}
              </p>
              <div className="mt-2">
                <ProgressBar
                  percent={s.usedPercent}
                  barClass={s.status === "over" ? "bg-rose-500" : s.info.bar}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* daily chart */}
      <Card>
        <CardHeader
          title="Daily spending"
          subtitle="Every day of the month — bars show how much went out"
          action={
            <Chip className="bg-slate-50 text-slate-600 ring-slate-200">
              Peak {formatMoney(maxDay, currency)}
            </Chip>
          }
        />
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-[540px] items-end gap-[3px] sm:min-w-0">
            {series.map((point) => {
              const height = point.total > 0 ? Math.max(4, (point.total / maxDay) * 100) : 2;
              const isFuture = point.date > `${month}-31`;
              return (
                <div
                  key={point.date}
                  className="group flex flex-1 flex-col items-center gap-1"
                  title={`${point.date}: ${formatMoney(point.total, currency)}`}
                >
                  <span className="text-[9px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
                    {point.total > 0 ? Math.round(point.total) : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-sm transition ${
                      point.total > 0
                        ? "bg-indigo-500 group-hover:bg-indigo-600"
                        : isFuture
                          ? "bg-slate-100"
                          : "bg-slate-200"
                    }`}
                    style={{ height: `${height}%`, minHeight: 6 }}
                  />
                  <span className="text-[8px] font-medium text-slate-400">
                    {point.day % 5 === 0 || point.day === 1 ? point.day : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* per item table */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PackageSearch className="h-4 w-4 text-indigo-500" /> Cost per item
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Same item merged together — total, purchase count and average
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search item…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={filter === "all" ? undefined : `${btnSecondary} !py-1.5 !text-xs`}
            style={
              filter === "all"
                ? { backgroundColor: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }
                : undefined
            }
          >
            All
          </button>
          {CATEGORIES.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`${btnSecondary} !py-1.5 !text-xs ${active ? "!border-transparent" : ""}`}
                style={
                  active
                    ? { backgroundColor: "#4f46e5", color: "#fff" }
                    : undefined
                }
              >
                {c.short} ({c.percent}%)
              </button>
            );
          })}
          {query || filter !== "all" ? (
            <button
              type="button"
              className={`${btnSecondary} !py-1.5 !text-xs`}
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Reset
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<BarChart3 className="h-10 w-10" />}
              title={allItems.length === 0 ? "Nothing to report yet" : "No items match"}
              description={
                allItems.length === 0
                  ? "Once you log expenses in the Daily Log, this report will show exactly how much each item cost you."
                  : "Try a different search term or reset the filters."
              }
            />
          </div>
        ) : (
          <>
            {/* header row (desktop) */}
            <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span className="col-span-4">Item</span>
              <span className="col-span-2 text-right">Purchases</span>
              <span className="col-span-2 text-right">Avg cost</span>
              <span className="col-span-2 text-right">Total spent</span>
              <span className="col-span-2">vs budget</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const info = CATEGORY_MAP[item.category];
                const budgetUse =
                  item.budget && item.budget > 0 ? percentOf(item.total, item.budget) : null;
                return (
                  <li
                    key={item.key}
                    className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-12 md:items-center md:px-5"
                  >
                    <div className="col-span-2 min-w-0 md:col-span-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                        <Chip className={info.chip}>{info.short}</Chip>
                      </div>
                      <div className="mt-1 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-slate-100 md:hidden">
                        <div
                          className={`h-full rounded-full ${info.bar}`}
                          style={{ width: `${Math.max(4, (item.total / maxItem) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right md:col-span-2">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 md:hidden">
                        Purchases{" "}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {item.count}×
                      </span>
                    </div>

                    <div className="text-right md:col-span-2">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 md:hidden">
                        Avg{" "}
                      </span>
                      <span className="text-sm text-slate-600">
                        {formatMoney(item.average, currency)}
                      </span>
                    </div>

                    <div className="text-right md:col-span-2">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 md:hidden">
                        Total{" "}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatMoney(item.total, currency)}
                      </span>
                    </div>

                    <div className="col-span-2 md:col-span-2">
                      {item.budget ? (
                        <>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              {formatMoney(item.total, currency)} /{" "}
                              {formatMoney(item.budget, currency)}
                            </span>
                            <span className="font-semibold">{Math.round(budgetUse ?? 0)}%</span>
                          </div>
                          <div className="mt-1">
                            <ProgressBar
                              percent={budgetUse ?? 0}
                              barClass={
                                (budgetUse ?? 0) > 100 ? "bg-rose-500" : info.bar
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">
                          no budget set
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs">
              <span className="text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"} shown
              </span>
              <span className="font-semibold text-slate-800">
                Sum: {formatMoney(items.reduce((sum, i) => sum + i.total, 0), currency)}
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
