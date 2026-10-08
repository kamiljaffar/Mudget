import { prisma } from "./db";
import { cache } from "react";
import type {
  CategoryDTO,
  ExpenseDTO,
  ItemDTO,
  PlanDTO,
  ProfileDTO,
  RuleDTO,
  Workspace,
} from "./types";
import { slugify } from "./palette";

export const DEFAULT_RULES: {
  name: string;
  isActive: boolean;
  categories: { label: string; percent: number; color: string }[];
}[] = [
  {
    name: "60 / 25 / 15",
    isActive: true,
    categories: [
      { label: "Basic", percent: 60, color: "sky" },
      { label: "Wants", percent: 25, color: "amber" },
      { label: "Loans / Investments", percent: 15, color: "violet" },
    ],
  },
  {
    name: "50 / 30 / 20",
    isActive: false,
    categories: [
      { label: "Needs", percent: 50, color: "emerald" },
      { label: "Wants", percent: 30, color: "orange" },
      { label: "Savings", percent: 20, color: "indigo" },
    ],
  },
];

/** Unique, stable category keys inside one rule (slug of the label). */
export function buildCategoryKeys(labels: string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const base = slugify(label) || "category";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

export async function loadWorkspace(userId: string): Promise<Workspace> {
  const [user, rules, plans, items, expenses] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.rule.findMany({
      where: { userId },
      include: { categories: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.monthPlan.findMany({ where: { userId }, orderBy: { month: "asc" } }),
    prisma.budgetItem.findMany({
      where: { userId },
      include: { plan: { select: { month: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const ruleDTOs: RuleDTO[] = rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    isActive: rule.isActive,
    categories: rule.categories.map(
      (c): CategoryDTO => ({
        key: c.key,
        label: c.label,
        percent: c.percent,
        color: c.color,
      }),
    ),
  }));

  const activeRule =
    ruleDTOs.find((r) => r.isActive) ?? ruleDTOs[0] ?? null;

  const profile: ProfileDTO = {
    id: user.id,
    email: user.email,
    name: user.name,
    currency: user.currency,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt.toISOString(),
  };

  return {
    profile,
    rules: ruleDTOs,
    activeRule,
    plans: plans.map(
      (p): PlanDTO => ({ month: p.month, income: p.income }),
    ),
    items: items.map(
      (i): ItemDTO => ({
        id: i.id,
        month: i.plan.month,
        name: i.name,
        amount: i.amount,
        categoryKey: i.categoryKey,
        expenseId: null,
        createdAt: i.createdAt.toISOString(),
      }),
    ),
    expenses: expenses.map(
      (e): ExpenseDTO => ({
        id: e.id,
        date: e.date,
        item: e.item,
        amount: e.amount,
        categoryKey: e.categoryKey,
        note: e.note,
        budgetItemId: e.budgetItemId,
      }),
    ),
  };
}

/** Same data for layout + page in one request (deduped by React cache). */
export const getWorkspace = cache(async (userId: string): Promise<Workspace> =>
  linkCompletedItems(await loadWorkspace(userId)),
);

/** Wire up `expenseId` on items using the expense ↔ budgetItem link. */
export function linkCompletedItems(workspace: Workspace): Workspace {
  const byItem = new Map<string, string>();
  for (const expense of workspace.expenses) {
    if (expense.budgetItemId) byItem.set(expense.budgetItemId, expense.id);
  }
  return {
    ...workspace,
    items: workspace.items.map((item) => ({
      ...item,
      expenseId: byItem.get(item.id) ?? null,
    })),
  };
}
