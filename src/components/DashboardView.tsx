"use client";

import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  PiggyBank,
  Plus,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EASE,
  FadeIn,
  PageHeader,
  ProgressBar,
  Stagger,
  StaggerItem,
  StatCard,
} from "@/components/ui";
import { categoryStats, monthSummary, expensesOfMonth } from "@/lib/calc";
import { formatMoney, monthLabel, dayLabel } from "@/lib/format";
import { useMonth } from "@/lib/providers";
import type { Workspace } from "@/lib/types";

const STATUS_BAR: Record<string, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  over: "bg-rose-500",
  unset: "bg-slate-300",
};

export function DashboardView({ workspace }: { workspace: Workspace }) {
  const { month } = useMonth();
  const currency = workspace.profile.currency;
  const summary = monthSummary(workspace, month);
  const stats = categoryStats(workspace, month);
  const recent = expensesOfMonth(workspace, month).slice(0, 5);

  const usedPercent =
    summary.income > 0 ? (summary.spent / summary.income) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Hello, ${workspace.profile.name.split(" ")[0]}`}
        subtitle={`Here is how ${monthLabel(month)} is going.`}
      >
        <MonthSwitcher />
      </PageHeader>

      {/* hero */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-indigo-600/25 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-violet-400/20 blur-2xl"
          />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                Remaining this month
              </p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="mt-1.5 text-4xl font-black tracking-tight sm:text-5xl"
              >
                {formatMoney(summary.remaining, currency)}
              </motion.p>
              <p className="mt-1.5 text-xs text-white/70">
                {formatMoney(summary.income, currency)} income ·{" "}
                {formatMoney(summary.spent, currency)} spent
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link
                href="/log"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Add expense
              </Link>
              <Link
                href="/budget"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25 active:scale-[0.98]"
              >
                <Target className="h-4 w-4" />
                Plan budget
              </Link>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-white/75">
              <span>{Math.round(usedPercent)}% of income used</span>
              <span>{summary.daysLeft} days left</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, usedPercent)}%` }}
                transition={{ duration: 1.1, ease: EASE }}
              />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* stat cards */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Income",
            value: formatMoney(summary.income, currency),
            hint: monthLabel(month),
            icon: <Wallet className="h-4 w-4" />,
          },
          {
            label: "Spent",
            value: formatMoney(summary.spent, currency),
            hint: `${summary.transactionCount} transactions`,
            accent: "text-rose-600",
            icon: <Receipt className="h-4 w-4" />,
          },
          {
            label: "Budgeted",
            value: formatMoney(summary.budgeted, currency),
            hint: `${summary.daysTotal} day month`,
            accent: "text-indigo-600",
            icon: <Target className="h-4 w-4" />,
          },
          {
            label: "Daily average",
            value: formatMoney(summary.dailyAverage, currency),
            hint:
              summary.isCurrentMonth && summary.projected > 0
                ? `Projected ${formatMoney(summary.projected, currency)}`
                : `${summary.uniqueItems} unique items`,
            accent: "text-emerald-600",
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ].map((card) => (
          <StaggerItem key={card.label}>
            <StatCard {...card} />
          </StaggerItem>
        ))}
      </Stagger>

      {/* rule breakdown */}
      <FadeIn delay={0.1}>
        <Card
          hover
          className={
            workspace.activeRule ? undefined : "border-dashed border-slate-300"
          }
        >
          <CardHeader
            icon={<Target className="h-4 w-4" />}
            title={
              workspace.activeRule
                ? `${workspace.activeRule.name} rule`
                : "No rule selected"
            }
            subtitle={
              workspace.activeRule
                ? "Har category ki limit vs asal kharcha."
                : "Budget tab se koi rule select karein."
            }
            action={
              <Link
                href="/budget"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Rules <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <div className="space-y-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.info.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * index, ease: EASE }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={clsx(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        stat.info.bar,
                      )}
                    />
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {stat.info.label}
                    </span>
                    {stat.info.percent > 0 ? (
                      <Chip className="bg-slate-50 text-slate-500 ring-slate-200">
                        {stat.info.percent}%
                      </Chip>
                    ) : null}
                    {stat.status === "over" ? (
                      <Chip className="bg-rose-50 text-rose-600 ring-rose-200">
                        over limit
                      </Chip>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatMoney(stat.spent, currency)}
                      <span className="text-xs font-medium text-slate-400">
                        {" "}
                        / {formatMoney(stat.limit, currency)}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {stat.remaining >= 0
                        ? `${formatMoney(stat.remaining, currency)} left`
                        : `${formatMoney(Math.abs(stat.remaining), currency)} over`}
                    </p>
                  </div>
                </div>
                <ProgressBar
                  percent={stat.usedPercent}
                  barClass={STATUS_BAR[stat.status] ?? "bg-indigo-500"}
                  delay={0.1 + index * 0.07}
                />
                {stat.budgeted > 0 ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Planned {formatMoney(stat.budgeted, currency)} of{" "}
                    {formatMoney(stat.limit, currency)}
                  </p>
                ) : null}
              </motion.div>
            ))}
          </div>
        </Card>
      </FadeIn>

      {/* recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.15}>
          <Card className="h-full">
            <CardHeader
              icon={<Receipt className="h-4 w-4" />}
              title="Recent expenses"
              subtitle={`${monthLabel(month)} · latest ${recent.length}`}
              action={
                <Link
                  href="/log"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
                >
                  Open log <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Abhi tak koi expense nahi
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pehla kharcha add karein ya budget item ko tick karein.
                </p>
                <Link
                  href="/log"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Add expense
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((expense) => {
                  const info = stats.find((s) => s.info.key === expense.categoryKey);
                  return (
                    <li
                      key={expense.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={clsx(
                            "h-8 w-1.5 shrink-0 rounded-full",
                            info?.info.bar ?? "bg-slate-300",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {expense.item}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {dayLabel(expense.date)} · {info?.info.label ?? expense.categoryKey}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatMoney(expense.amount, currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="h-full">
            <CardHeader
              icon={<PiggyBank className="h-4 w-4" />}
              title="Upcoming plan"
              subtitle="Is mahine ke budgeted items"
              action={
                <Link
                  href="/budget"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
                >
                  Manage <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <PlanPreview workspace={workspace} month={month} />
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

function PlanPreview({ workspace, month }: { workspace: Workspace; month: string }) {
  const currency = workspace.profile.currency;
  const items = workspace.items.filter((item) => item.month === month);
  const pending = items.filter((item) => !item.expenseId);
  const done = items.filter((item) => item.expenseId);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Planning shuru nahi hui
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Budget tab mein items add karein — poori ho jayein to tick dabayein.
        </p>
        <Link
          href="/budget"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          <Target className="h-3.5 w-3.5" /> Open budget
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Completed
          </p>
          <p className="text-lg font-bold text-slate-900">
            {done.length}
            <span className="text-xs font-medium text-slate-400"> / {items.length}</span>
          </p>
        </div>
        <div className="w-32">
          <ProgressBar
            percent={items.length ? (done.length / items.length) * 100 : 0}
            barClass="bg-indigo-500"
          />
          <p className="mt-1 text-right text-[11px] text-slate-500">
            {formatMoney(
              done.reduce((sum, item) => sum + item.amount, 0),
              currency,
            )}{" "}
            logged
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {pending.slice(0, 5).map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-300" />
              <span className="truncate text-sm font-medium text-slate-700">
                {item.name}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {formatMoney(item.amount, currency)}
            </span>
          </li>
        ))}
        {pending.length === 0 ? (
          <li className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs font-medium text-emerald-700">
            Sab planned items complete ho chuke hain. Shabash! 🎉
          </li>
        ) : null}
      </ul>

      {pending.length > 5 ? (
        <p className="text-[11px] text-slate-400">
          +{pending.length - 5} more pending…
        </p>
      ) : null}
    </div>
  );
}
