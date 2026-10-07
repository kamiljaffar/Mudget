"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, PieChart, Plus, TrendingUp } from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/ui";
import { categoryStats, itemStats, monthSummary } from "@/lib/calc";
import { formatMoney, monthLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

export function DashboardView() {
  const { state, hydrated } = useApp();

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const month = state.selectedMonth;
  const currency = state.currency;
  const summary = monthSummary(state, month);
  const stats = categoryStats(state, month);
  const topItems = itemStats(state, month).slice(0, 5);
  const recent = state.expenses
    .filter((e) => e.date.slice(0, 7) === month)
    .slice()
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const over = stats.filter((s) => s.status === "over");

  const isEmpty = summary.income === 0 && summary.transactionCount === 0;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Dashboard"
        subtitle={`${monthLabel(month)} · ${summary.transactionCount} transactions logged`}
      >
        <MonthSwitcher />
        <Link
          href="/log"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add expense</span>
          <span className="sm:hidden">Log</span>
        </Link>
      </PageHeader>

      {isEmpty ? (
        <EmptyState
          icon={<PieChart className="h-10 w-10" />}
          title="Let's set up this month's budget"
          description="Enter your monthly income and your pre-defined budget items. Mudget will split it with the 60 / 25 / 15 rule and track every daily expense against it."
          action={
            <Link
              href="/budget"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Open Monthly Budget <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <>
          {over.length > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
              <div className="text-sm">
                <p className="font-semibold text-rose-800">
                  {over.length === 1
                    ? "One category is over its 60/25/15 limit"
                    : `${over.length} categories are over their 60/25/15 limits`}
                </p>
                <p className="mt-0.5 text-xs text-rose-700">
                  {over
                    .map(
                      (s) =>
                        `${s.info.label}: over by ${formatMoney(Math.abs(s.remaining), currency)}`,
                    )
                    .join(" · ")}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Monthly income"
              value={formatMoney(summary.income, currency)}
              hint={monthLabel(month)}
            />
            <StatCard
              label="Total spent"
              value={formatMoney(summary.spent, currency)}
              accent="text-rose-600"
              hint={`${summary.transactionCount} transactions`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="Remaining"
              value={formatMoney(summary.remaining, currency)}
              accent={summary.remaining < 0 ? "text-rose-600" : "text-emerald-600"}
              hint={
                summary.income > 0
                  ? `${Math.max(0, Math.round((summary.spent / summary.income) * 100))}% of income used`
                  : "Set income to see %"
              }
            />
            <StatCard
              label={summary.isCurrentMonth ? "Projected spend" : "Month total"}
              value={formatMoney(summary.projected, currency)}
              accent="text-indigo-600"
              hint={
                summary.isCurrentMonth
                  ? `${formatMoney(summary.dailyAverage, currency)}/day avg · ${summary.daysLeft} days left`
                  : `Avg ${formatMoney(summary.dailyAverage, currency)}/day`
              }
            />
          </div>

          {/* 60 / 25 / 15 rule bar */}
          <Card>
            <CardHeader
              title="The 60 / 25 / 15 rule"
              subtitle="How this month's income is allowed to be split"
              action={
                <Chip className="bg-indigo-50 text-indigo-700 ring-indigo-200">
                  Income {formatMoney(summary.income, currency)}
                </Chip>
              }
            />
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {stats.map((s) => (
                <div
                  key={s.info.id}
                  className={`${s.info.bar} h-full transition-all duration-500`}
                  style={{ width: `${s.info.percent}%` }}
                  title={`${s.info.label} ${s.info.percent}%`}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {stats.map((s) => (
                <div key={s.info.id} className="rounded-xl bg-slate-50 px-2 py-2.5">
                  <p className={`text-[11px] font-semibold ${s.info.text}`}>
                    {s.info.percent}% {s.info.short}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 sm:text-sm">
                    {formatMoney(s.limit, currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* category cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {stats.map((s) => {
              const barColor =
                s.status === "over"
                  ? "bg-rose-500"
                  : s.status === "warning"
                    ? "bg-amber-500"
                    : s.info.bar;
              return (
                <Card key={s.info.id} className={s.info.card}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.info.label}</p>
                      <p className="text-[11px] text-slate-500">{s.info.hint}</p>
                    </div>
                    <Chip className={s.info.chip}>{s.info.percent}%</Chip>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Spent
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(s.spent, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Left
                      </p>
                      <p
                        className={`text-lg font-bold ${s.remaining < 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {formatMoney(s.remaining, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar percent={s.usedPercent} barClass={barColor} />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {formatMoney(s.spent, currency)} of {formatMoney(s.limit, currency)}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {Math.round(s.usedPercent)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                    <span className="text-slate-500">
                      Planned: <b className="text-slate-700">{formatMoney(s.budgeted, currency)}</b>
                    </span>
                    {s.status === "over" ? (
                      <Chip className="bg-rose-50 text-rose-700 ring-rose-200">Over limit</Chip>
                    ) : s.status === "warning" ? (
                      <Chip className="bg-amber-50 text-amber-700 ring-amber-200">
                        Getting close
                      </Chip>
                    ) : (
                      <Chip className="bg-emerald-50 text-emerald-700 ring-emerald-200">On track</Chip>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Recent activity"
                subtitle="Latest entries from the daily log"
                action={
                  <Link
                    href="/log"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No expenses logged this month yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recent.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{e.item}</p>
                        <p className="text-[11px] text-slate-400">
                          {e.date} · {e.category === "basic" ? "Basic" : e.category === "wants" ? "Wants" : "Loans"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-900">
                        −{formatMoney(e.amount, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Top spending items"
                subtitle="Where the money went this month"
                action={
                  <Link
                    href="/reports"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Reports <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {topItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Log a few expenses to see rankings.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {topItems.map((item) => {
                    const max = topItems[0].total || 1;
                    const info =
                      item.category === "basic"
                        ? stats[0].info
                        : item.category === "wants"
                          ? stats[1].info
                          : stats[2].info;
                    return (
                      <li key={item.key}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-slate-700">{item.name}</span>
                          <span className="shrink-0 font-semibold text-slate-900">
                            {formatMoney(item.total, currency)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${info.bar}`}
                            style={{ width: `${Math.max(6, (item.total / max) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
