"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "@/components/icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EmptyState,
  PageHeader,
  ProgressBar,
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  selectClass,
} from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { categoryStats, getPlan } from "@/lib/calc";
import { formatMoney, monthLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { AppState, CategoryId } from "@/lib/types";

export function BudgetView() {
  const {
    state,
    hydrated,
    setIncome,
    setCurrency,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    replaceState,
    resetAll,
  } = useApp();

  const month = state.selectedMonth;
  const currency = state.currency;
  const plan = getPlan(state, month);
  const stats = categoryStats(state, month);

  const [incomeInput, setIncomeInput] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("basic");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryId>("basic");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIncomeInput(plan.income ? String(plan.income) : "");
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, hydrated]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((info) => ({
        info,
        items: plan.items.filter((i) => i.category === info.id),
        stat: stats.find((s) => s.info.id === info.id)!,
      })),
    [plan.items, stats],
  );

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    const value = Number(amount);
    if (!trimmed) return;
    if (!Number.isFinite(value) || value <= 0) return;
    addBudgetItem(month, { name: trimmed, amount: value, category });
    setName("");
    setAmount("");
  }

  function startEdit(id: string) {
    const item = plan.items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditCategory(item.category);
  }

  function saveEdit() {
    if (!editingId) return;
    const value = Number(editAmount);
    if (!editName.trim() || !Number.isFinite(value) || value <= 0) return;
    updateBudgetItem(month, editingId, {
      name: editName.trim(),
      amount: value,
      category: editCategory,
    });
    setEditingId(null);
  }

  function handleExport() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mudget-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded.");
    } catch {
      setMessage("Could not create the backup file.");
    }
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.expenses)) {
          throw new Error("invalid");
        }
        replaceState(parsed);
        setMessage("Backup restored.");
      } catch {
        setMessage("That file is not a valid Mudget backup.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleReset() {
    if (window.confirm("Delete ALL data (income, budgets and every expense)? This cannot be undone.")) {
      resetAll();
      setMessage("All data cleared.");
    }
  }

  if (!hydrated) {
    return (
      <div className="grid gap-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  const plannedTotal = plan.items.reduce((sum, i) => sum + i.amount, 0);
  const unallocated = plan.income - plannedTotal;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Monthly Budget"
        subtitle={`${monthLabel(month)} · predefined budget items and the 60/25/15 rule`}
      >
        <MonthSwitcher />
      </PageHeader>

      {message ? (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <Check className="h-4 w-4" /> {message}
        </div>
      ) : null}

      {/* income + rule */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Monthly income" subtitle={`Currency: ${currency}`} />
          <label className={labelClass} htmlFor="income">
            Income for {monthLabel(month)}
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
              {currency}
            </div>
            <input
              id="income"
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              value={incomeInput}
              placeholder="e.g. 100000"
              onChange={(e) => {
                setIncomeInput(e.target.value);
                setIncome(month, e.target.value === "" ? 0 : Number(e.target.value));
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1">
              <label className={labelClass} htmlFor="currency">
                Currency symbol
              </label>
              <input
                id="currency"
                className={inputClass}
                value={currency}
                maxLength={6}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Everything is saved automatically in this browser (localStorage). Use the backup
            buttons below before clearing browser data.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Rule limits (60 / 25 / 15)"
            subtitle="Maximum allowed per category this month"
            action={
              <Chip className="bg-slate-50 text-slate-600 ring-slate-200">
                Planned {formatMoney(plannedTotal, currency)}
              </Chip>
            }
          />
          <div className="grid gap-3">
            {stats.map((s) => {
              const overBudget = s.budgeted > s.limit && s.limit > 0;
              return (
                <div key={s.info.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${s.info.text}`}>
                        {s.info.percent}% {s.info.label}
                      </span>
                      <Chip className={s.info.chip}>max {formatMoney(s.limit, currency)}</Chip>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      Planned {formatMoney(s.budgeted, currency)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      percent={s.budgetedPercent}
                      barClass={overBudget ? "bg-rose-500" : s.info.bar}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{s.info.hint}</span>
                    {overBudget ? (
                      <span className="flex items-center gap-1 font-semibold text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Over by {formatMoney(s.budgeted - s.limit, currency)}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">
                        {formatMoney(s.limit - s.budgeted, currency)} unplanned
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs text-indigo-800">
            <span>
              Total planned: <b>{formatMoney(plannedTotal, currency)}</b> of{" "}
              {formatMoney(plan.income, currency)}
            </span>
            <span className="font-semibold">
              {unallocated >= 0
                ? `${formatMoney(unallocated, currency)} not assigned yet`
                : `Over-planned by ${formatMoney(Math.abs(unallocated), currency)}`}
            </span>
          </div>
        </Card>
      </div>

      {/* add budget item */}
      <Card>
        <CardHeader title="Add budget item" subtitle="Predefined spending you plan every month" />
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.8fr_auto] sm:items-end">
          <div>
            <label className={labelClass} htmlFor="item-name">
              Item name
            </label>
            <input
              id="item-name"
              className={inputClass}
              placeholder="e.g. Rent, Groceries, Car installment"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="item-category">
              Category
            </label>
            <select
              id="item-category"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.percent}% · {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="item-amount">
              Amount
            </label>
            <input
              id="item-amount"
              type="number"
              min={0}
              inputMode="numeric"
              className={inputClass}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button type="submit" className={btnPrimary}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </Card>

      {/* items grouped by category */}
      {plan.items.length === 0 ? (
        <EmptyState
          title="No budget items yet"
          description="Add your predefined monthly items above (rent, groceries, loan instalments…). Daily expenses with the same name will be matched automatically."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {grouped.map(({ info, items, stat }) => (
            <Card key={info.id} className={info.card}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{info.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatMoney(stat.budgeted, currency)} of {formatMoney(stat.limit, currency)}
                  </p>
                </div>
                <Chip className={info.chip}>{info.percent}%</Chip>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {items.map((item) =>
                  editingId === item.id ? (
                    <li key={item.id} className="grid gap-2 py-3">
                      <input
                        className={inputClass}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Item name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className={inputClass}
                          type="number"
                          min={0}
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                        <select
                          className={selectClass}
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as CategoryId)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.short}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className={btnPrimary} onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={item.id} className="flex items-center justify-between gap-2 py-2.5">
                      <span className="truncate text-sm font-medium text-slate-700">
                        {item.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatMoney(item.amount, currency)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => startEdit(item.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => removeBudgetItem(month, item.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                  ),
                )}
              </ul>

              {items.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-400">
                  No items in this category yet.
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {/* data / backup */}
      <Card>
        <CardHeader
          title="Backup & data"
          subtitle="Mudget stores everything in this browser only"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={handleExport}>
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <label className={`${btnSecondary} cursor-pointer`}>
            <Upload className="h-4 w-4" /> Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            type="button"
            className={`${btnSecondary} !text-rose-600 hover:!bg-rose-50`}
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" /> Delete all data
          </button>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          Data lives in this device's browser. Export a backup before switching browsers or
          clearing site data.
        </p>
      </Card>
    </div>
  );
}
