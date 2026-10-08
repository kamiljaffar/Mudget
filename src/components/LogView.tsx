"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CirclePlus,
  Pencil,
  Search,
  Trash2,
  X,
} from "@/components/icons";
import { CategorySelect } from "@/components/fields";
import {
  Card,
  Chip,
  EmptyState,
  FadeIn,
  Modal,
  PageHeader,
  Stagger,
  StaggerItem,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { activeCategories, expensesOfMonth } from "@/lib/calc";
import { dayLabel, formatMoney, monthLabel, todayISO } from "@/lib/format";
import { useMonth, useToast } from "@/lib/providers";
import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "@/lib/actions";
import { useAction } from "@/lib/useAction";
import type { ExpenseDTO, Workspace } from "@/lib/types";

interface FormState {
  date: string;
  item: string;
  amount: string;
  categoryKey: string;
  note: string;
}

const emptyForm = (categoryKey: string): FormState => ({
  date: todayISO(),
  item: "",
  amount: "",
  categoryKey,
  note: "",
});

export function LogView({ workspace }: { workspace: Workspace }) {
  const { month } = useMonth();
  const { notify } = useToast();
  const currency = workspace.profile.currency;
  const categories = activeCategories(workspace, month);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(categories[0]?.key ?? "basic"),
  );
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const add = useAction(addExpense);
  const update = useAction(updateExpense);
  const remove = useAction(deleteExpense);

  const all = expensesOfMonth(workspace, month);
  const total = all.reduce((sum, expense) => sum + expense.amount, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter((expense) => {
      if (categoryFilter !== "all" && expense.categoryKey !== categoryFilter)
        return false;
      if (!needle) return true;
      return (
        expense.item.toLowerCase().includes(needle) ||
        (expense.note ?? "").toLowerCase().includes(needle)
      );
    });
  }, [all, query, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseDTO[]>();
    for (const expense of filtered) {
      const list = map.get(expense.date) ?? [];
      list.push(expense);
      map.set(expense.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm(categories[0]?.key ?? "basic"));
    setOpen(true);
  }

  function openEdit(expense: ExpenseDTO) {
    setEditing(expense);
    setForm({
      date: expense.date,
      item: expense.item,
      amount: String(expense.amount),
      categoryKey: expense.categoryKey,
      note: expense.note ?? "",
    });
    setOpen(true);
  }

  async function submit() {
    const amount = Number(form.amount);
    if (!form.item.trim()) {
      notify("Item ka naam likhein.", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Amount 0 se zyada hona chahiye.", "error");
      return;
    }

    const result = editing
      ? await update.run({
          id: editing.id,
          date: form.date,
          item: form.item,
          amount,
          categoryKey: form.categoryKey,
          note: form.note,
        })
      : await add.run({
          date: form.date,
          item: form.item,
          amount,
          categoryKey: form.categoryKey,
          note: form.note,
        });

    if (result?.ok) setOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily Log"
        subtitle={`${monthLabel(month)} · ${all.length} expenses · ${formatMoney(total, currency)}`}
      >
        <MonthSwitcher />
        <button type="button" onClick={openAdd} className={btnPrimary}>
          <CirclePlus className="h-4 w-4" />
          Add expense
        </button>
      </PageHeader>

      {/* filters */}
      <FadeIn>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={clsx(inputClass, "pl-10")}
              placeholder="Item ya note search karein…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <FilterChip
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              label="All"
            />
            {categories.map((category) => (
              <FilterChip
                key={category.key}
                active={categoryFilter === category.key}
                onClick={() => setCategoryFilter(category.key)}
                label={category.label}
                barClass={category.bar}
              />
            ))}
          </div>
        </div>
      </FadeIn>

      {grouped.length === 0 ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title={all.length === 0 ? "Is month koi expense nahi" : "Koi match nahi mila"}
            description={
              all.length === 0
                ? "Roz ka kharcha yahan add karein — ya budget tab se planned item ko tick kar dein."
                : "Filter ya search change kar ke dekhein."
            }
            action={
              all.length === 0 ? (
                <button type="button" onClick={openAdd} className={btnPrimary}>
                  <CirclePlus className="h-4 w-4" /> Add expense
                </button>
              ) : undefined
            }
          />
        </FadeIn>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, list], groupIndex) => {
            const dayTotal = list.reduce((sum, e) => sum + e.amount, 0);
            return (
              <FadeIn key={date} delay={Math.min(groupIndex * 0.05, 0.3)}>
                <Card className="p-0 sm:p-0">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {dayLabel(date)}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatMoney(dayTotal, currency)}
                    </p>
                  </div>

                  <Stagger gap={0.04}>
                    {list.map((expense) => {
                      const info = categories.find(
                        (category) => category.key === expense.categoryKey,
                      );
                      return (
                        <StaggerItem key={expense.id}>
                          <div className="group flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0 transition hover:bg-slate-50/70">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={clsx(
                                  "h-9 w-1.5 shrink-0 rounded-full",
                                  info?.bar ?? "bg-slate-300",
                                )}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {expense.item}
                                  {expense.budgetItemId ? (
                                    <Chip className="ml-2 bg-indigo-50 text-indigo-600 ring-indigo-200">
                                      from plan
                                    </Chip>
                                  ) : null}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  {info?.label ?? expense.categoryKey}
                                  {expense.note ? ` · ${expense.note}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900">
                                {formatMoney(expense.amount, currency)}
                              </span>
                              <div className="flex items-center opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                                <IconButton
                                  label="Edit"
                                  onClick={() => openEdit(expense)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </IconButton>
                                <IconButton
                                  label="Delete"
                                  danger
                                  armed={pendingDelete === expense.id}
                                  onClick={() => {
                                    if (pendingDelete === expense.id) {
                                      setPendingDelete(null);
                                      void remove.run({ id: expense.id });
                                    } else {
                                      setPendingDelete(expense.id);
                                      window.setTimeout(
                                        () => setPendingDelete(null),
                                        3000,
                                      );
                                    }
                                  }}
                                >
                                  {pendingDelete === expense.id ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit expense" : "Add expense"}
        subtitle={monthLabel(month)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={add.busy || update.busy}
              className={btnPrimary}
            >
              {add.busy || update.busy ? "Saving…" : editing ? "Save changes" : "Add expense"}
            </button>
          </>
        }
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Item</span>
            <input
              className={inputClass}
              value={form.item}
              onChange={(event) => setForm({ ...form, item: event.target.value })}
              placeholder="e.g. Groceries"
              autoFocus
            />
          </label>

          <label className="block">
            <span className={labelClass}>Amount</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              className={inputClass}
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              placeholder="0"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Date</span>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Category (rule)</span>
            <CategorySelect
              categories={categories}
              value={form.categoryKey}
              onChange={(key) => setForm({ ...form, categoryKey: key })}
              allowOther
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Note (optional)</span>
            <input
              className={inputClass}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="e.g. weekly bazaar"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  barClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  barClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
        active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      {barClass ? (
        <span className={clsx("h-2 w-2 rounded-full", barClass)} />
      ) : null}
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
  armed,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  armed?: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={clsx(
        "grid h-8 w-8 place-items-center rounded-lg transition",
        armed
          ? "bg-rose-600 text-white"
          : danger
            ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600",
      )}
    >
      {children}
    </motion.button>
  );
}
