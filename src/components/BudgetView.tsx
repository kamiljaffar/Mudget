"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CirclePlus,
  Database,
  Download,
  Layers,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wallet,
} from "@/components/icons";
import { CategorySelect, ColorDot } from "@/components/fields";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import {
  Card,
  CardHeader,
  Chip,
  EASE,
  EmptyState,
  FadeIn,
  Modal,
  PageHeader,
  Stagger,
  StaggerItem,
  btnPrimary,
  btnSecondary,
  btnGhost,
  inputClass,
  labelClass,
} from "@/components/ui";
import { activeCategories } from "@/lib/calc";
import { formatMoney, monthLabel, todayISO } from "@/lib/format";
import { downloadBackup, pickBackup } from "@/lib/backup";
import { useMonth, useToast } from "@/lib/providers";
import { useAction } from "@/lib/useAction";
import {
  addBudgetItem,
  createRule,
  deleteBudgetItem,
  deleteRule,
  importBackup,
  resetAllData,
  setIncome,
  setActiveRule,
  toggleItemComplete,
  updateBudgetItem,
  updateRule,
} from "@/lib/actions";
import { COLOR_TOKENS, colorStyle } from "@/lib/palette";
import type { Workspace } from "@/lib/types";

/* --------------------------------------------------------------- state */

interface RuleForm {
  id?: string;
  name: string;
  categories: { label: string; percent: string; color: string }[];
}

interface ItemForm {
  id?: string;
  name: string;
  amount: string;
  categoryKey: string;
}

const blankRule = (): RuleForm => ({
  name: "",
  categories: [
    { label: "Basic", percent: "60", color: "sky" },
    { label: "Wants", percent: "25", color: "amber" },
    { label: "Loans / Investments", percent: "15", color: "violet" },
  ],
});

export function BudgetView({ workspace }: { workspace: Workspace }) {
  const { month } = useMonth();
  const { notify } = useToast();
  const currency = workspace.profile.currency;
  const categories = activeCategories(workspace, month);

  const income =
    workspace.plans.find((plan) => plan.month === month)?.income ?? 0;
  const [incomeDraft, setIncomeDraft] = useState<string>(String(income || ""));
  const items = workspace.items.filter((item) => item.month === month);

  // keep the income field in sync when the month (or saved value) changes
  useEffect(() => {
    setIncomeDraft(String(income || ""));
  }, [month, income]);

  /* actions */
  const changeIncome = useAction(setIncome);
  const additem = useAction(addBudgetItem);
  const editItem = useAction(updateBudgetItem);
  const removeItem = useAction(deleteBudgetItem);
  const toggleItem = useAction(toggleItemComplete);
  const applyRule = useAction(setActiveRule);
  const saveRule = useAction(createRule);
  const saveExistingRule = useAction(updateRule);
  const removeRule = useAction(deleteRule);
  const restore = useAction(importBackup);
  const reset = useAction(resetAllData);

  /* modal state */
  const [ruleModal, setRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState<RuleForm>(blankRule);
  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const ruleTotal = ruleForm.categories.reduce(
    (sum, row) => sum + (Number(row.percent) || 0),
    0,
  );

  async function submitIncome() {
    const value = Number(incomeDraft);
    if (!Number.isFinite(value) || value < 0) {
      notify("Sahi income dalein.", "error");
      return;
    }
    await changeIncome.run({ month, income: value });
  }

  async function submitRule() {
    const payload = {
      name: ruleForm.name,
      categories: ruleForm.categories.map((row) => ({
        label: row.label,
        percent: Number(row.percent) || 0,
        color: row.color,
      })),
    };
    const result = ruleForm.id
      ? await saveExistingRule.run({ id: ruleForm.id, ...payload })
      : await saveRule.run(payload);
    if (result?.ok) setRuleModal(false);
  }

  function editRuleForm(ruleId: string) {
    const rule = workspace.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    setRuleForm({
      id: rule.id,
      name: rule.name,
      categories: rule.categories.map((c) => ({
        label: c.label,
        percent: String(c.percent),
        color: c.color,
      })),
    });
    setRuleModal(true);
  }

  function openNewItem() {
    setItemForm({
      name: "",
      amount: "",
      categoryKey: categories[0]?.key ?? "basic",
    });
    setItemModal(true);
  }

  function openEditItem(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItemForm({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      categoryKey: item.categoryKey,
    });
    setItemModal(true);
  }

  async function submitItem() {
    if (!itemForm) return;
    const amount = Number(itemForm.amount);
    if (!itemForm.name.trim()) {
      notify("Item ka naam likhein.", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Amount 0 se zyada hona chahiye.", "error");
      return;
    }
    const payload = {
      name: itemForm.name,
      amount,
      categoryKey: itemForm.categoryKey,
    };
    const result = itemForm.id
      ? await editItem.run({ id: itemForm.id, ...payload })
      : await additem.run({ month, ...payload });
    if (result?.ok) setItemModal(false);
  }

  const plannedTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const completedCount = items.filter((item) => item.expenseId).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly Budget"
        subtitle={`${monthLabel(month)} · plan, rules aur backup`}
      >
        <MonthSwitcher />
      </PageHeader>

      {/* income */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <span className={labelClass}>Monthly income ({monthLabel(month)})</span>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="numeric"
                    className={clsx(inputClass, "pl-10 text-base font-semibold")}
                    value={incomeDraft}
                    onChange={(event) => setIncomeDraft(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={submitIncome}
                  disabled={changeIncome.busy}
                  className={btnPrimary}
                >
                  {changeIncome.busy ? "Saving…" : "Save"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Rule limits income ke hisaab se calculate hote hain.
              </p>
            </div>

            <div className="flex gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Planned
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {formatMoney(plannedTotal, currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Completed
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {completedCount}
                  <span className="text-sm font-medium text-slate-400">
                    /{items.length}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ---------------------------------------------------------- rules */}
      <FadeIn delay={0.05}>
        <Card>
          <CardHeader
            icon={<Layers className="h-4 w-4" />}
            title="Budget rules"
            subtitle="Ek rule select karo — wohi puri app pe apply hota hai. Naya rule bana sakte ho."
            action={
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setRuleForm(blankRule());
                  setRuleModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New rule
              </button>
            }
          />

          <Stagger className="grid gap-3 md:grid-cols-2" gap={0.07}>
            {workspace.rules.map((rule) => (
              <StaggerItem key={rule.id}>
                <motion.div
                  layout
                  className={clsx(
                    "relative rounded-2xl border p-4 transition",
                    rule.isActive
                      ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-white shadow-md shadow-indigo-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  {rule.isActive ? (
                    <motion.span
                      layoutId="active-rule-glow"
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-indigo-400/60"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                        {rule.isActive ? (
                          <Chip className="bg-indigo-600 text-white ring-indigo-600">
                            active
                          </Chip>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {rule.categories.map((c) => `${c.percent}%`).join(" · ")}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <IconAction label="Edit rule" onClick={() => editRuleForm(rule.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </IconAction>
                      <IconAction
                        label="Delete rule"
                        danger
                        armed={pendingDelete === rule.id}
                        disabled={rule.isActive}
                        onClick={() => {
                          if (pendingDelete === rule.id) {
                            setPendingDelete(null);
                            void removeRule.run({ id: rule.id });
                          } else {
                            setPendingDelete(rule.id);
                            window.setTimeout(() => setPendingDelete(null), 3000);
                          }
                        }}
                      >
                        {pendingDelete === rule.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </IconAction>
                    </div>
                  </div>

                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    {rule.categories.map((category) => (
                      <span
                        key={category.key}
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
                          colorStyle(category.color).chip,
                        )}
                      >
                        <span
                          className={clsx(
                            "h-1.5 w-1.5 rounded-full",
                            colorStyle(category.color).bar,
                          )}
                        />
                        {category.label} · {category.percent}%
                      </span>
                    ))}
                  </div>

                  {!rule.isActive ? (
                    <button
                      type="button"
                      onClick={() => applyRule.run({ id: rule.id })}
                      disabled={applyRule.busy}
                      className="relative mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 active:scale-[0.98] disabled:opacity-60"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply this rule
                    </button>
                  ) : null}
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </FadeIn>

      {/* ---------------------------------------------------------- items */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader
            icon={<Target className="h-4 w-4" />}
            title="Planned items"
            subtitle="Tick dabate hi usi din ki expense khud ban jati hai."
            action={
              <button type="button" onClick={openNewItem} className={btnPrimary}>
                <CirclePlus className="h-4 w-4" />
                Add item
              </button>
            }
          />

          {items.length === 0 ? (
            <EmptyState
              icon={<Target className="h-8 w-8" />}
              title="Is month koi plan nahi"
              description="Items add karein (rent, groceries, fees…) — poori ho jayein to tick dabayein aur expense khud add ho jayegi."
              action={
                <button type="button" onClick={openNewItem} className={btnPrimary}>
                  <CirclePlus className="h-4 w-4" /> Add first item
                </button>
              }
            />
          ) : (
            <Stagger className="space-y-2.5" gap={0.05}>
              {items.map((item) => {
                const info = categories.find((c) => c.key === item.categoryKey);
                const done = Boolean(item.expenseId);
                return (
                  <StaggerItem key={item.id}>
                    <motion.div
                      layout
                      className={clsx(
                        "group flex items-center gap-3 rounded-2xl border px-3 py-3 transition",
                        done
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <button
                        type="button"
                        aria-label={done ? "Mark as pending" : "Mark as completed"}
                        disabled={toggleItem.busy}
                        onClick={() =>
                          toggleItem.run({ itemId: item.id, date: todayISO() })
                        }
                        className={clsx(
                          "relative grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 disabled:opacity-60",
                          done
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                            : "border-slate-300 bg-white text-transparent hover:border-indigo-400 hover:text-slate-300",
                        )}
                      >
                        <AnimatePresence initial={false}>
                          {done ? (
                            <motion.span
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            >
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            "truncate text-sm font-semibold",
                            done ? "text-slate-500 line-through" : "text-slate-800",
                          )}
                        >
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                              info?.chip ?? "bg-slate-50 text-slate-600 ring-slate-200",
                            )}
                          >
                            {info?.label ?? item.categoryKey}
                          </span>
                          {done ? (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              expense added · {todayISO()}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">pending</span>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatMoney(item.amount, currency)}
                      </span>

                      <div className="flex shrink-0 gap-0.5">
                        <IconAction label="Edit item" onClick={() => openEditItem(item.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label="Delete item"
                          danger
                          armed={pendingDelete === item.id}
                          onClick={() => {
                            if (pendingDelete === item.id) {
                              setPendingDelete(null);
                              void removeItem.run({ id: item.id });
                            } else {
                              setPendingDelete(item.id);
                              window.setTimeout(() => setPendingDelete(null), 3000);
                            }
                          }}
                        >
                          {pendingDelete === item.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </IconAction>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}

          {items.length > 0 ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total planned
              </p>
              <p className="text-sm font-bold text-slate-900">
                {formatMoney(plannedTotal, currency)}
                {income > 0 ? (
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {Math.round((plannedTotal / income) * 100)}% of income
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}
        </Card>
      </FadeIn>

      {/* --------------------------------------------------------- backup */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader
            icon={<Database className="h-4 w-4" />}
            title="Data backup"
            subtitle="Sab kuch Neon database pe sync hota hai — phir bhi JSON backup le sakte hain."
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                downloadBackup(workspace, month);
                notify("Backup download ho gaya", "success");
              }}
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                pickBackup((payload) => {
                  if (!payload) {
                    notify("File read nahi ho saki.", "error");
                    return;
                  }
                  void restore.run(payload);
                })
              }
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                if (
                  window.confirm(
                    "Saara data (rules, plans, expenses) delete kar ke default rules wapas la dein?",
                  )
                ) {
                  void reset.run();
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset data
            </button>
          </div>
        </Card>
      </FadeIn>

      {/* ------------------------------------------------------ rule modal */}
      <Modal
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        title={ruleForm.id ? "Edit rule" : "New budget rule"}
        subtitle="Percent ka total 100% hona chahiye."
        footer={
          <>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setRuleModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={saveRule.busy || saveExistingRule.busy}
              onClick={submitRule}
            >
              <Percent className="h-4 w-4" />
              {saveRule.busy || saveExistingRule.busy ? "Saving…" : "Save rule"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Rule name</span>
            <input
              className={inputClass}
              value={ruleForm.name}
              placeholder="e.g. 70/20/10"
              onChange={(event) =>
                setRuleForm({ ...ruleForm, name: event.target.value })
              }
              autoFocus
            />
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={labelClass + " mb-0"}>Categories</span>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                  Math.round(ruleTotal) === 100
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-rose-50 text-rose-600 ring-rose-200",
                )}
              >
                Total {ruleTotal}%
              </span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {ruleForm.categories.map((row, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        className={clsx(inputClass, "flex-1 bg-white")}
                        value={row.label}
                        placeholder="Label"
                        onChange={(event) => {
                          const categories = [...ruleForm.categories];
                          categories[index] = {
                            ...row,
                            label: event.target.value,
                          };
                          setRuleForm({ ...ruleForm, categories });
                        }}
                      />
                      <div className="relative w-20 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className={clsx(inputClass, "bg-white pr-6 text-right")}
                          value={row.percent}
                          onChange={(event) => {
                            const categories = [...ruleForm.categories];
                            categories[index] = {
                              ...row,
                              percent: event.target.value,
                            };
                            setRuleForm({ ...ruleForm, categories });
                          }}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove category"
                        disabled={ruleForm.categories.length <= 1}
                        onClick={() =>
                          setRuleForm({
                            ...ruleForm,
                            categories: ruleForm.categories.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {COLOR_TOKENS.map((token) => (
                        <ColorDot
                          key={token}
                          token={token}
                          barClass={colorStyle(token).bar}
                          active={row.color === token}
                          onClick={() => {
                            const categories = [...ruleForm.categories];
                            categories[index] = { ...row, color: token };
                            setRuleForm({ ...ruleForm, categories });
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className={clsx(btnGhost, "mt-2.5 w-full border border-dashed border-slate-300")}
              onClick={() =>
                setRuleForm({
                  ...ruleForm,
                  categories: [
                    ...ruleForm.categories,
                    { label: "", percent: "0", color: COLOR_TOKENS[0] },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add category
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------- item modal */}
      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={itemForm?.id ? "Edit planned item" : "Add planned item"}
        subtitle={monthLabel(month)}
        footer={
          <>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setItemModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={additem.busy || editItem.busy}
              onClick={submitItem}
            >
              <Check className="h-4 w-4" />
              {additem.busy || editItem.busy
                ? "Saving…"
                : itemForm?.id
                  ? "Save changes"
                  : "Add item"}
            </button>
          </>
        }
      >
        {itemForm ? (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Item name</span>
              <input
                className={inputClass}
                value={itemForm.name}
                placeholder="e.g. Electricity bill"
                onChange={(event) =>
                  setItemForm({ ...itemForm, name: event.target.value })
                }
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
                value={itemForm.amount}
                placeholder="0"
                onChange={(event) =>
                  setItemForm({ ...itemForm, amount: event.target.value })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <CategorySelect
                categories={categories}
                value={itemForm.categoryKey}
                onChange={(key) => setItemForm({ ...itemForm, categoryKey: key })}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function IconAction({
  children,
  label,
  onClick,
  danger,
  armed,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  armed?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      className={clsx(
        "grid h-8 w-8 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30",
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
