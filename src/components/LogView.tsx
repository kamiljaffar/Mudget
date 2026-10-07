"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Pencil, Plus, Search, Trash2, X } from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EmptyState,
  PageHeader,
  StatCard,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  selectClass,
} from "@/components/ui";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { expensesOfMonth, findBudgetItem, monthSummary } from "@/lib/calc";
import { dayLabel, formatMoney, todayISO } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { CategoryId } from "@/lib/types";

interface FormState {
  date: string;
  item: string;
  amount: string;
  category: CategoryId;
  note: string;
}

const emptyForm = (): FormState => ({
  date: "",
  item: "",
  amount: "",
  category: "basic",
  note: "",
});

export function LogView() {
  const { state, hydrated, addExpense, updateExpense, removeExpense } = useApp();
  const month = state.selectedMonth;
  const currency = state.currency;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matched, setMatched] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    setForm((prev) => ({ ...prev, date: prev.date || todayISO() }));
  }, [hydrated]);

  // when the item name matches a predefined budget item, pull its category automatically
  useEffect(() => {
    if (!hydrated) return;
    const match = findBudgetItem(state, month, form.item);
    setMatched(match ? match.name : null);
    if (match && form.item.trim() !== "" && form.category !== match.category) {
      setForm((prev) => ({ ...prev, category: match.category }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.item, month, hydrated]);

  const summary = monthSummary(state, month);
  const expenses = useMemo(
    () =>
      expensesOfMonth(state, month)
        .slice()
        .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1)),
    [state, month],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (e) =>
        e.item.toLowerCase().includes(q) ||
        (e.note ?? "").toLowerCase().includes(q) ||
        e.category.includes(q),
    );
  }, [expenses, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const expense of filtered) {
      const list = map.get(expense.date) ?? [];
      list.push(expense);
      map.set(expense.date, list);
    }
    return Array.from(map.entries()).map(([date, list]) => ({
      date,
      list,
      total: list.reduce((sum, e) => sum + e.amount, 0),
    }));
  }, [filtered]);

  const todayTotal = expenses
    .filter((e) => e.date === todayISO())
    .reduce((sum, e) => sum + e.amount, 0);

  const suggestions = useMemo(() => {
    const names = new Set<string>();
    for (const item of state.plans[month]?.items ?? []) names.add(item.name);
    for (const expense of state.expenses) names.add(expense.item);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [state.plans, state.expenses, month]);

  function resetForm() {
    setForm({ ...emptyForm(), date: todayISO() });
    setEditId(null);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = form.item.trim();
    const value = Number(form.amount);
    if (!trimmed) {
      setError("Item name is required.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    const date = form.date || todayISO();
    const payload = {
      date,
      item: trimmed,
      amount: value,
      category: form.category,
      note: form.note.trim() || undefined,
    };

    if (editId) updateExpense(editId, payload);
    else addExpense(payload);

    resetForm();
  }

  function startEdit(expense: (typeof expenses)[number]) {
    setEditId(expense.id);
    setForm({
      date: expense.date,
      item: expense.item,
      amount: String(expense.amount),
      category: expense.category,
      note: expense.note ?? "",
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Daily Log"
        subtitle="Every expense is deducted from its 60/25/15 category"
      >
        <MonthSwitcher />
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Spent today"
          value={formatMoney(todayTotal, currency)}
          accent="text-rose-600"
        />
        <StatCard
          label="This month"
          value={formatMoney(summary.spent, currency)}
          accent="text-slate-900"
        />
        <StatCard
          label="Left"
          value={formatMoney(summary.remaining, currency)}
          accent={summary.remaining < 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      {/* entry form */}
      <Card>
        <CardHeader
          title={editId ? "Edit expense" : "Log an expense"}
          subtitle="Pick the category the money came from"
          action={
            editId ? (
              <button type="button" className={btnSecondary} onClick={resetForm}>
                <X className="h-4 w-4" /> Cancel edit
              </button>
            ) : null
          }
        />
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="amount">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                className={inputClass}
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="item">
              Item / what did you buy
            </label>
            <input
              id="item"
              className={inputClass}
              list="item-suggestions"
              placeholder="e.g. Groceries, Fuel, Milk"
              value={form.item}
              onChange={(e) => setForm((prev) => ({ ...prev, item: e.target.value }))}
            />
            <datalist id="item-suggestions">
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {matched ? (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-indigo-600">
                <Check className="h-3.5 w-3.5" /> Matches budget item “{matched}” — category set
                automatically.
              </p>
            ) : null}
          </div>

          <div>
            <span className={labelClass}>Category (60 / 25 / 15)</span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, category: c.id }))}
                  className={`rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition ${
                    form.category === c.id
                      ? `${c.chip} ring-1 ring-inset`
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-[10px] font-bold opacity-70">{c.percent}%</span>
                  {c.short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="note">
              Note (optional)
            </label>
            <input
              id="note"
              className={inputClass}
              placeholder="e.g. monthly ration from Ittehad store"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

          <button type="submit" className={`${btnPrimary} w-full sm:w-auto sm:justify-self-start`}>
            <Plus className="h-4 w-4" />
            {editId ? "Save changes" : "Add expense"}
          </button>
        </form>
      </Card>

      {/* filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search in this month's log…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query ? (
          <button type="button" className={btnSecondary} onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </div>

      {/* grouped list */}
      {groups.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title={query ? "Nothing matches that search" : "No expenses logged yet"}
          description={
            query
              ? "Try a different keyword or clear the search."
              : `Add your first expense above and it will be deducted from its category for ${state.selectedMonth}.`
          }
        />
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Card key={group.date} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {dayLabel(group.date)}
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {formatMoney(group.total, currency)}
                </p>
              </div>
              <ul className="divide-y divide-slate-100">
                {group.list.map((expense) => {
                  const info = CATEGORY_MAP[expense.category];
                  return (
                    <li
                      key={expense.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {expense.item}
                          </p>
                          <Chip className={info.chip}>{info.short}</Chip>
                        </div>
                        {expense.note ? (
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {expense.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          −{formatMoney(expense.amount, currency)}
                        </span>
                        <button
                          type="button"
                          aria-label="Edit expense"
                          onClick={() => startEdit(expense)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete expense"
                          onClick={() => {
                            if (editId === expense.id) resetForm();
                            removeExpense(expense.id);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
