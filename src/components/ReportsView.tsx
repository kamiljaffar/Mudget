"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  Search,
  Target,
  TrendingUp,
} from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EASE,
  EmptyState,
  FadeIn,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/ui";
import {
  categoryStats,
  dailySeries,
  itemStats,
  monthSummary,
} from "@/lib/calc";
import { daysInMonth, formatMoney, monthLabel, monthShort } from "@/lib/format";
import { useMonth } from "@/lib/providers";
import type { Workspace } from "@/lib/types";

export function ReportsView({ workspace }: { workspace: Workspace }) {
  const { month } = useMonth();
  const currency = workspace.profile.currency;
  const summary = monthSummary(workspace, month);
  const stats = categoryStats(workspace, month);
  const series = useMemo(() => dailySeries(workspace, month), [workspace, month]);
  const items = useMemo(() => itemStats(workspace, month), [workspace, month]);

  const [query, setQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const maxDay = Math.max(1, ...series.map((point) => point.total));
  const maxTotal = Math.max(1, summary.spent);
  const heaviest = series.reduce(
    (best, point) => (point.total > best.total ? point : best),
    series[0],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={`${monthLabel(month)} · item-wise spending analysis`}
      >
        <MonthSwitcher />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total spent"
          value={formatMoney(summary.spent, currency)}
          hint={`${summary.transactionCount} transactions`}
          accent="text-rose-600"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Unique items"
          value={String(summary.uniqueItems)}
          hint="Alag alag cheezein"
          accent="text-indigo-600"
          icon={<Target className="h-4 w-4" />}
          delay={0.05}
        />
        <StatCard
          label="Heaviest day"
          value={
            heaviest && heaviest.total > 0
              ? formatMoney(heaviest.total, currency)
              : formatMoney(0, currency)
          }
          hint={
            heaviest && heaviest.total > 0
              ? `${monthShort(month)} ${heaviest.day}`
              : "No data yet"
          }
          accent="text-amber-600"
          icon={<CalendarDays className="h-4 w-4" />}
          delay={0.1}
        />
        <StatCard
          label="Budgeted"
          value={formatMoney(summary.budgeted, currency)}
          hint={
            summary.budgeted > 0
              ? `${Math.round((summary.spent / summary.budgeted) * 100)}% used`
              : "Plan set nahi"
          }
          accent="text-emerald-600"
          icon={<BarChart3 className="h-4 w-4" />}
          delay={0.15}
        />
      </div>

      {/* daily chart */}
      <FadeIn delay={0.1}>
        <Card hover>
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Daily spending"
            subtitle={`Har din ka kharcha · peak ${formatMoney(maxDay, currency)}`}
          />
          {summary.spent === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-8 w-8" />}
              title="Chart ke liye data chahiye"
              description={`${monthLabel(month)} mein expense add karte hi yahan graph ban jayega.`}
            />
          ) : (
            <div className="relative">
              <div className="flex h-40 items-end gap-[3px] sm:gap-1.5">
                {series.map((point, index) => {
                  const height = (point.total / maxDay) * 100;
                  const hasData = point.total > 0;
                  return (
                    <div
                      key={point.date}
                      className="group relative flex h-full flex-1 items-end"
                      title={`${point.date}: ${formatMoney(point.total, currency)}`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(hasData ? 4 : 1, height)}%` }}
                        transition={{
                          duration: 0.7,
                          delay: Math.min(index * 0.012, 0.4),
                          ease: EASE,
                        }}
                        className={clsx(
                          "w-full rounded-t-md transition",
                          hasData
                            ? "bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:from-indigo-600 group-hover:to-indigo-500"
                            : "bg-slate-100",
                        )}
                      />
                      <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                        {formatMoney(point.total, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
                <span>1</span>
                <span>{Math.ceil(daysInMonth(month) / 2)}</span>
                <span>{daysInMonth(month)}</span>
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* category split */}
      <FadeIn delay={0.15}>
        <Card hover>
          <CardHeader
            icon={<Target className="h-4 w-4" />}
            title="Rule split"
            subtitle="Har category ka hissa asal kharche mein"
          />
          <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
            {stats
              .filter((stat) => stat.spent > 0)
              .map((stat, index) => (
                <motion.div
                  key={stat.info.key}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(stat.spent / maxTotal) * 100}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.1 + index * 0.08, ease: EASE }}
                  className={clsx("h-full", stat.info.bar)}
                  title={`${stat.info.label}: ${formatMoney(stat.spent, currency)}`}
                />
              ))}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.info.key}
                className={clsx(
                  "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                  stat.info.card,
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", stat.info.bar)}
                  />
                  <span className="truncate text-xs font-semibold text-slate-700">
                    {stat.info.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">
                    {formatMoney(stat.spent, currency)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {stat.limit > 0
                      ? `${Math.round(stat.usedPercent)}% of ${formatMoney(stat.limit, currency)}`
                      : "no limit"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      {/* item table */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader
            icon={<Search className="h-4 w-4" />}
            title="Item-wise cost"
            subtitle="Ek hi cheez kitni baar kharidi aur kitni baar kharch hui"
            action={
              <div className="relative hidden sm:block">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search item…"
                  className="w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            }
          />

          <div className="mb-3 sm:hidden">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search item…"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No items yet"
              description="Jaise hi expenses aayenge, yahan har item ka total, count aur average dikhega."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-semibold">Item</th>
                    <th className="pb-2 pr-3 font-semibold">Times</th>
                    <th className="pb-2 pr-3 font-semibold">Average</th>
                    <th className="pb-2 pr-3 font-semibold">Total</th>
                    <th className="pb-2 font-semibold">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const info = stats.find(
                      (stat) => stat.info.key === item.categoryKey,
                    );
                    return (
                      <motion.tr
                        key={item.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: Math.min(index * 0.04, 0.3),
                          ease: EASE,
                        }}
                        className="border-b border-slate-50 transition last:border-b-0 hover:bg-slate-50/70"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                "h-2 w-2 shrink-0 rounded-full",
                                info?.info.bar ?? "bg-slate-300",
                              )}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {item.name}
                                {item.completed ? (
                                  <Chip className="ml-2 bg-emerald-50 text-emerald-600 ring-emerald-200">
                                    completed
                                  </Chip>
                                ) : null}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {info?.info.label ?? item.categoryKey}
                                {item.firstDate
                                  ? ` · ${item.firstDate} → ${item.lastDate}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-sm text-slate-600">
                          {item.count > 0 ? `${item.count}×` : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-sm text-slate-600">
                          {item.count > 0 ? formatMoney(item.average, currency) : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-sm font-bold text-slate-900">
                          {formatMoney(item.total, currency)}
                        </td>
                        <td className="py-2.5">
                          {item.budget !== null ? (
                            <div className="w-28">
                              <ProgressBar
                                percent={
                                  item.budget > 0
                                    ? (item.total / item.budget) * 100
                                    : 0
                                }
                                barClass={
                                  item.total > item.budget
                                    ? "bg-rose-500"
                                    : "bg-emerald-500"
                                }
                                trackClass="bg-slate-100"
                              />
                              <p className="mt-1 text-[10px] text-slate-400">
                                {formatMoney(item.budget, currency)} planned
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
