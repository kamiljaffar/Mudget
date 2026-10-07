import { CATEGORIES, type CategoryInfo } from "./categories";
import { daysInMonth, monthKey, todayISO } from "./format";
import type { AppState, BudgetItem, CategoryId, Expense, MonthPlan } from "./types";

export const EMPTY_PLAN: MonthPlan = { income: 0, items: [] };

export function getPlan(state: AppState, month: string): MonthPlan {
  return state.plans[month] ?? EMPTY_PLAN;
}

export function expensesOfMonth(state: AppState, month: string): Expense[] {
  return state.expenses.filter((e) => monthKey(e.date) === month);
}

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
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

export function categoryStats(state: AppState, month: string): CategoryStat[] {
  const plan = getPlan(state, month);
  const expenses = expensesOfMonth(state, month);

  return CATEGORIES.map((info) => {
    const limit = (plan.income * info.percent) / 100;
    const budgeted = plan.items
      .filter((i) => i.category === info.id)
      .reduce((sum, i) => sum + i.amount, 0);
    const spent = expenses
      .filter((e) => e.category === info.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const usedPercent = limit > 0 ? (spent / limit) * 100 : 0;
    const budgetedPercent = limit > 0 ? (budgeted / limit) * 100 : 0;

    let status: CategoryStat["status"] = "ok";
    if (limit <= 0) status = spent > 0 ? "over" : "unset";
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

export function monthSummary(state: AppState, month: string): MonthSummary {
  const plan = getPlan(state, month);
  const expenses = expensesOfMonth(state, month);
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgeted = plan.items.reduce((sum, i) => sum + i.amount, 0);
  const total = daysInMonth(month);
  const nowMonth = todayISO().slice(0, 7);

  let elapsed: number;
  if (month < nowMonth) elapsed = total;
  else if (month > nowMonth) elapsed = 0;
  else elapsed = Number(todayISO().slice(8, 10));

  const dailyAverage = elapsed > 0 ? spent / elapsed : 0;

  return {
    income: plan.income,
    spent,
    remaining: plan.income - spent,
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
  category: CategoryId;
  total: number;
  count: number;
  average: number;
  firstDate: string;
  lastDate: string;
  budget: number | null;
}

export function itemStats(state: AppState, month: string): ItemStat[] {
  const plan = getPlan(state, month);
  const expenses = expensesOfMonth(state, month);

  const budgetByName = new Map<string, BudgetItem>();
  for (const item of plan.items) {
    budgetByName.set(normalizeItemName(item.name), item);
  }

  const grouped = new Map<
    string,
    { name: string; category: CategoryId; total: number; count: number; first: string; last: string }
  >();

  for (const expense of expenses) {
    const key = normalizeItemName(expense.item);
    if (!key) continue;
    const existing = grouped.get(key);
    if (existing) {
      existing.total += expense.amount;
      existing.count += 1;
      existing.first = expense.date < existing.first ? expense.date : existing.first;
      existing.last = expense.date > existing.last ? expense.date : existing.last;
      existing.category = expense.date >= existing.last ? expense.category : existing.category;
    } else {
      grouped.set(key, {
        name: expense.item.trim(),
        category: expense.category,
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
      category: budgetItem?.category ?? value.category,
      total: value.total,
      count: value.count,
      average: value.total / value.count,
      firstDate: value.first,
      lastDate: value.last,
      budget: budgetItem ? budgetItem.amount : null,
    });
  });

  return stats.sort((a, b) => b.total - a.total);
}

export interface DayPoint {
  date: string;
  day: number;
  total: number;
}

export function dailySeries(state: AppState, month: string): DayPoint[] {
  const expenses = expensesOfMonth(state, month);
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

export function findBudgetItem(
  state: AppState,
  month: string,
  name: string,
): BudgetItem | undefined {
  const key = normalizeItemName(name);
  if (!key) return undefined;
  return getPlan(state, month).items.find((i) => normalizeItemName(i.name) === key);
}

export function categoryTotals(state: AppState, month: string): CategoryStat[] {
  return categoryStats(state, month);
}
