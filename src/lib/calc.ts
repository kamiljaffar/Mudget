import { colorStyle, colorToken, type ColorToken } from "./palette";
import { daysInMonth, monthKey, todayISO } from "./format";
import type {
  CategoryDTO,
  ExpenseDTO,
  ItemDTO,
  PlanDTO,
  Workspace,
} from "./types";

/** Presentational info for one category of the active rule. */
export interface CategoryInfo {
  key: string;
  label: string;
  percent: number;
  color: ColorToken;
  bar: string;
  text: string;
  chip: string;
  card: string;
  soft: string;
  /** true for the synthetic bucket of entries not matching the active rule */
  unmatched?: boolean;
}

export function categoryInfo(category: CategoryDTO): CategoryInfo {
  const style = colorStyle(category.color);
  return {
    key: category.key,
    label: category.label,
    percent: category.percent,
    color: colorToken(category.color),
    ...style,
  };
}

export function getIncome(plans: PlanDTO[], month: string): number {
  return plans.find((p) => p.month === month)?.income ?? 0;
}

export function planItems(workspace: Workspace, month: string): ItemDTO[] {
  return workspace.items.filter((i) => i.month === month);
}

export function expensesOfMonth(workspace: Workspace, month: string): ExpenseDTO[] {
  return workspace.expenses.filter((e) => monthKey(e.date) === month);
}

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Category chips for the active rule (+ synthetic "Other" bucket when needed). */
export function activeCategories(
  workspace: Workspace,
  month?: string,
): CategoryInfo[] {
  const base = (workspace.activeRule?.categories ?? []).map(categoryInfo);
  if (!month) return base;

  const known = new Set(base.map((c) => c.key));
  const foreign = new Set<string>();
  for (const expense of expensesOfMonth(workspace, month)) {
    if (!known.has(expense.categoryKey)) foreign.add(expense.categoryKey);
  }
  for (const item of planItems(workspace, month)) {
    if (!known.has(item.categoryKey)) foreign.add(item.categoryKey);
  }
  if (foreign.size === 0) return base;

  const style = colorStyle("rose");
  return [
    ...base,
    {
      key: "__other__",
      label: "Other",
      percent: 0,
      color: "rose" as ColorToken,
      unmatched: true,
      ...style,
    },
  ];
}

export function findCategory(
  workspace: Workspace,
  month: string,
  key: string,
): CategoryInfo | undefined {
  return activeCategories(workspace, month).find((c) => c.key === key);
}

export interface CategoryStat {
  info: CategoryInfo;
  /** rule limit: income * percent */
  limit: number;
  /** sum of predefined budget items of this category */
  budgeted: number;
  /** sum of daily log expenses of this category */
  spent: number;
  /** limit - spent */
  remaining: number;
  /** budgeted - spent */
  budgetRemaining: number;
  usedPercent: number;
  budgetedPercent: number;
  status: "ok" | "warning" | "over" | "unset";
}

export function categoryStats(workspace: Workspace, month: string): CategoryStat[] {
  const income = getIncome(workspace.plans, month);
  const expenses = expensesOfMonth(workspace, month);
  const items = planItems(workspace, month);

  return activeCategories(workspace, month).map((info) => {
    const limit = (income * info.percent) / 100;
    const budgeted = items
      .filter((i) => i.categoryKey === info.key)
      .reduce((sum, i) => sum + i.amount, 0);
    const spent = expenses
      .filter((e) => e.categoryKey === info.key)
      .reduce((sum, e) => sum + e.amount, 0);

    const usedPercent = limit > 0 ? (spent / limit) * 100 : 0;
    const budgetedPercent = limit > 0 ? (budgeted / limit) * 100 : 0;

    let status: CategoryStat["status"] = "ok";
    if (info.unmatched) status = spent > 0 || budgeted > 0 ? "warning" : "unset";
    else if (limit <= 0) status = spent > 0 ? "over" : "unset";
    else if (usedPercent > 100) status = "over";
    else if (usedPercent >= 90) status = "warning";
    else if (budgeted > limit) status = "warning";

    return {
      info,
      limit,
      budgeted,
      spent,
      remaining: limit - spent,
      budgetRemaining: budgeted - spent,
      usedPercent,
      budgetedPercent,
      status,
    };
  });
}

export interface MonthSummary {
  income: number;
  spent: number;
  remaining: number;
  budgeted: number;
  transactionCount: number;
  uniqueItems: number;
  daysTotal: number;
  elapsedDays: number;
  daysLeft: number;
  dailyAverage: number;
  projected: number;
  isCurrentMonth: boolean;
}

export function monthSummary(workspace: Workspace, month: string): MonthSummary {
  const income = getIncome(workspace.plans, month);
  const expenses = expensesOfMonth(workspace, month);
  const items = planItems(workspace, month);
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgeted = items.reduce((sum, i) => sum + i.amount, 0);
  const total = daysInMonth(month);
  const nowMonth = todayISO().slice(0, 7);

  let elapsed: number;
  if (month < nowMonth) elapsed = total;
  else if (month > nowMonth) elapsed = 0;
  else elapsed = Number(todayISO().slice(8, 10));

  const dailyAverage = elapsed > 0 ? spent / elapsed : 0;

  return {
    income,
    spent,
    remaining: income - spent,
    budgeted,
    transactionCount: expenses.length,
    uniqueItems: new Set(expenses.map((e) => normalizeItemName(e.item))).size,
    daysTotal: total,
    elapsedDays: elapsed,
    daysLeft: Math.max(0, total - elapsed),
    dailyAverage,
    projected: month === nowMonth ? dailyAverage * total : spent,
    isCurrentMonth: month === nowMonth,
  };
}

export interface ItemStat {
  key: string;
  name: string;
  categoryKey: string;
  total: number;
  count: number;
  average: number;
  firstDate: string;
  lastDate: string;
  budget: number | null;
  completed: boolean;
}

export function itemStats(workspace: Workspace, month: string): ItemStat[] {
  const items = planItems(workspace, month);
  const expenses = expensesOfMonth(workspace, month);

  const budgetByName = new Map<string, ItemDTO>();
  for (const item of items) {
    budgetByName.set(normalizeItemName(item.name), item);
  }

  const grouped = new Map<
    string,
    {
      name: string;
      categoryKey: string;
      total: number;
      count: number;
      first: string;
      last: string;
    }
  >();

  for (const expense of expenses) {
    const key = normalizeItemName(expense.item);
    if (!key) continue;
    const existing = grouped.get(key);
    if (existing) {
      existing.total += expense.amount;
      existing.count += 1;
      if (expense.date < existing.first) existing.first = expense.date;
      if (expense.date > existing.last) {
        existing.last = expense.date;
        existing.categoryKey = expense.categoryKey;
      }
    } else {
      grouped.set(key, {
        name: expense.item.trim(),
        categoryKey: expense.categoryKey,
        total: expense.amount,
        count: 1,
        first: expense.date,
        last: expense.date,
      });
    }
  }

  const stats: ItemStat[] = [];
  grouped.forEach((value, key) => {
    const budgetItem = budgetByName.get(key);
    stats.push({
      key,
      name: value.name,
      categoryKey: budgetItem?.categoryKey ?? value.categoryKey,
      total: value.total,
      count: value.count,
      average: value.total / value.count,
      firstDate: value.first,
      lastDate: value.last,
      budget: budgetItem ? budgetItem.amount : null,
      completed: Boolean(budgetItem?.expenseId),
    });
  });

  // planned items that have no expense yet
  for (const item of items) {
    const key = normalizeItemName(item.name);
    if (!key || stats.some((s) => s.key === key)) continue;
    stats.push({
      key,
      name: item.name,
      categoryKey: item.categoryKey,
      total: 0,
      count: 0,
      average: 0,
      firstDate: "",
      lastDate: "",
      budget: item.amount,
      completed: Boolean(item.expenseId),
    });
  }

  return stats.sort((a, b) => b.total - a.total);
}

export interface DayPoint {
  date: string;
  day: number;
  total: number;
}

export function dailySeries(workspace: Workspace, month: string): DayPoint[] {
  const expenses = expensesOfMonth(workspace, month);
  const total = daysInMonth(month);
  const byDay = new Map<string, number>();

  for (const expense of expenses) {
    byDay.set(expense.date, (byDay.get(expense.date) ?? 0) + expense.amount);
  }

  const points: DayPoint[] = [];
  for (let day = 1; day <= total; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    points.push({ date, day, total: byDay.get(date) ?? 0 });
  }
  return points;
}

/** Months that have a plan or any expense, newest first. */
export function monthsWithData(workspace: Workspace): string[] {
  const set = new Set<string>(workspace.plans.map((p) => p.month));
  for (const expense of workspace.expenses) set.add(monthKey(expense.date));
  for (const item of workspace.items) set.add(item.month);
  return Array.from(set).sort().reverse();
}
