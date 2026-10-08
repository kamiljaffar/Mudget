"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "./auth";
import { buildCategoryKeys, DEFAULT_RULES } from "./workspace";
import { isColorToken } from "./palette";
import { todayISO } from "./format";
import type { ActionResult } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function done(message?: string): ActionResult {
  return message ? { ok: true, message } : { ok: true };
}

function refresh() {
  revalidatePath("/", "layout");
}

async function actor() {
  return getCurrentUser();
}

/* ------------------------------------------------------------------ auth */

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";

  if (name.length < 2) return fail("Naam kam se kam 2 characters ka hona chahiye.");
  if (!EMAIL_RE.test(email)) return fail("Sahi email address dalein.");
  if (password.length < 6) return fail("Password kam se kam 6 characters ka ho.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("Is email pe pehle se account hai. Login karein.");

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  // default rules: 60/25/15 (active) and 50/30/20 (ready to switch to)
  for (const rule of DEFAULT_RULES) {
    const keys = buildCategoryKeys(rule.categories.map((c) => c.label));
    await prisma.rule.create({
      data: {
        userId: user.id,
        name: rule.name,
        isActive: rule.isActive,
        categories: {
          create: rule.categories.map((c, i) => ({
            key: keys[i],
            label: c.label,
            percent: c.percent,
            color: c.color,
            order: i,
          })),
        },
      },
    });
  }

  await createSession(user.id);
  refresh();
  return done("Account ban gaya — welcome to Mudget!");
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  if (!email || !password) return fail("Email aur password dono zaroori hain.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail("Email ya password ghalat hai.");
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Email ya password ghalat hai.");

  await createSession(user.id);
  refresh();
  return done("Logged in");
}

export async function logout(): Promise<ActionResult> {
  await destroySession();
  refresh();
  return done("Logged out");
}

/* --------------------------------------------------------------- profile */

export async function updateProfile(input: {
  name: string;
  currency: string;
  avatarColor: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const name = input.name?.trim() ?? "";
  if (name.length < 2) return fail("Naam kam se kam 2 characters ka hona chahiye.");
  const currency = (input.currency || "Rs").trim().slice(0, 6);
  const avatarColor = isColorToken(input.avatarColor) ? input.avatarColor : "indigo";

  await prisma.user.update({
    where: { id: user.id },
    data: { name, currency, avatarColor },
  });
  refresh();
  return done("Profile update ho gaya");
}

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const valid = await verifyPassword(input.current ?? "", user.passwordHash);
  if (!valid) return fail("Maujooda password ghalat hai.");
  if ((input.next ?? "").length < 6) return fail("Naya password kam se kam 6 characters ka ho.");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.next) },
  });
  refresh();
  return done("Password change ho gaya");
}

/* ----------------------------------------------------------------- rules */

interface RuleCategoryInput {
  label: string;
  percent: number;
  color: string;
}

function validateRule(name: string, categories: RuleCategoryInput[]): string | null {
  if (!name.trim()) return "Rule ka naam zaroori hai.";
  if (categories.length < 1) return "Kam se kam ek category chahiye.";
  const labels = new Set<string>();
  let total = 0;
  for (const c of categories) {
    if (!c.label?.trim()) return "Har category ka naam chahiye.";
    const key = c.label.trim().toLowerCase();
    if (labels.has(key)) return `Category "${c.label}" do baar hai.`;
    labels.add(key);
    if (!Number.isFinite(c.percent) || c.percent <= 0)
      return `"${c.label}" ka percent 0 se zyada hona chahiye.`;
    total += c.percent;
  }
  if (Math.round(total) !== 100)
    return `Percent ka total 100% hona chahiye (abhi ${total}% hai).`;
  return null;
}

export async function createRule(input: {
  name: string;
  categories: RuleCategoryInput[];
  activate?: boolean;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const categories = input.categories ?? [];
  const problem = validateRule(input.name ?? "", categories);
  if (problem) return fail(problem);

  const keys = buildCategoryKeys(categories.map((c) => c.label));
  const count = await prisma.rule.count({ where: { userId: user.id } });

  await prisma.$transaction(async (tx) => {
    if (input.activate || count === 0) {
      await tx.rule.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
    }
    await tx.rule.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        isActive: input.activate || count === 0,
        categories: {
          create: categories.map((c, i) => ({
            key: keys[i],
            label: c.label.trim(),
            percent: Math.round(c.percent),
            color: isColorToken(c.color) ? c.color : "indigo",
            order: i,
          })),
        },
      },
    });
  });

  refresh();
  return done("Rule add ho gaya");
}

export async function updateRule(input: {
  id: string;
  name: string;
  categories: RuleCategoryInput[];
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const problem = validateRule(input.name ?? "", input.categories ?? []);
  if (problem) return fail(problem);

  const existing = await prisma.rule.findFirst({
    where: { id: input.id, userId: user.id },
    include: { categories: { orderBy: { order: "asc" } } },
  });
  if (!existing) return fail("Rule nahi mila.");

  // keep the old keys by position so existing expenses still match
  const oldKeys = existing.categories.map((c) => c.key);
  const freshKeys = buildCategoryKeys(input.categories.map((c) => c.label));
  const keys = input.categories.map((_, i) => oldKeys[i] ?? freshKeys[i]);

  await prisma.$transaction(async (tx) => {
    await tx.ruleCategory.deleteMany({ where: { ruleId: existing.id } });
    await tx.rule.update({
      where: { id: existing.id },
      data: {
        name: input.name.trim(),
        categories: {
          create: input.categories.map((c, i) => ({
            key: keys[i],
            label: c.label.trim(),
            percent: Math.round(c.percent),
            color: isColorToken(c.color) ? c.color : "indigo",
            order: i,
          })),
        },
      },
    });
  });

  refresh();
  return done("Rule update ho gaya");
}

export async function deleteRule(input: { id: string }): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const rule = await prisma.rule.findFirst({
    where: { id: input.id, userId: user.id },
  });
  if (!rule) return fail("Rule nahi mila.");
  if (rule.isActive) {
    const others = await prisma.rule.count({ where: { userId: user.id, NOT: { id: rule.id } } });
    if (others > 0) return fail("Active rule delete nahi kar sakte — pehle koi doosra select karein.");
    return fail("Kam se kam ek rule chahiye.");
  }

  await prisma.rule.delete({ where: { id: rule.id } });
  refresh();
  return done("Rule delete ho gaya");
}

export async function setActiveRule(input: { id: string }): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const rule = await prisma.rule.findFirst({ where: { id: input.id, userId: user.id } });
  if (!rule) return fail("Rule nahi mila.");

  await prisma.$transaction([
    prisma.rule.updateMany({ where: { userId: user.id }, data: { isActive: false } }),
    prisma.rule.update({ where: { id: rule.id }, data: { isActive: true } }),
  ]);
  refresh();
  return done(`"${rule.name}" apply ho gaya`);
}

/* ----------------------------------------------------------- budget plan */

async function ensurePlan(userId: string, month: string) {
  if (!MONTH_RE.test(month)) return null;
  return prisma.monthPlan.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month, income: 0 },
  });
}

export async function setIncome(input: {
  month: string;
  income: number;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");
  const income = Number(input.income);
  if (!Number.isFinite(income) || income < 0) return fail("Sahi income dalein.");

  const plan = await ensurePlan(user.id, input.month);
  if (!plan) return fail("Sahi month dalein.");

  await prisma.monthPlan.update({
    where: { id: plan.id },
    data: { income },
  });
  refresh();
  return done();
}

async function activeCategoryKey(userId: string): Promise<string[]> {
  const rule = await prisma.rule.findFirst({
    where: { userId, isActive: true },
    include: { categories: true },
  });
  return (rule?.categories ?? []).map((c) => c.key);
}

export async function addBudgetItem(input: {
  month: string;
  name: string;
  amount: number;
  categoryKey: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const name = input.name?.trim() ?? "";
  const amount = Number(input.amount);
  if (!name) return fail("Item ka naam zaroori hai.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount 0 se zyada hona chahiye.");

  const keys = await activeCategoryKey(user.id);
  if (!keys.includes(input.categoryKey)) return fail("Category select karein.");

  const plan = await ensurePlan(user.id, input.month);
  if (!plan) return fail("Sahi month dalein.");

  await prisma.budgetItem.create({
    data: {
      userId: user.id,
      planId: plan.id,
      name,
      amount,
      categoryKey: input.categoryKey,
    },
  });
  refresh();
  return done("Budget item add ho gaya");
}

export async function updateBudgetItem(input: {
  id: string;
  name: string;
  amount: number;
  categoryKey: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const item = await prisma.budgetItem.findFirst({ where: { id: input.id, userId: user.id } });
  if (!item) return fail("Item nahi mila.");

  const name = input.name?.trim() ?? "";
  const amount = Number(input.amount);
  if (!name) return fail("Item ka naam zaroori hai.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount 0 se zyada hona chahiye.");

  const keys = await activeCategoryKey(user.id);
  const categoryKey = keys.includes(input.categoryKey) ? input.categoryKey : item.categoryKey;

  await prisma.budgetItem.update({
    where: { id: item.id },
    data: { name, amount, categoryKey },
  });
  refresh();
  return done("Item update ho gaya");
}

export async function deleteBudgetItem(input: { id: string }): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const item = await prisma.budgetItem.findFirst({ where: { id: input.id, userId: user.id } });
  if (!item) return fail("Item nahi mila.");

  await prisma.budgetItem.delete({ where: { id: item.id } });
  refresh();
  return done("Item delete ho gaya");
}

/**
 * Tick/untick a planned item as complete.
 * Ticking creates today's expense for the same item; unticking removes it.
 */
export async function toggleItemComplete(input: {
  itemId: string;
  date?: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const item = await prisma.budgetItem.findFirst({
    where: { id: input.itemId, userId: user.id },
  });
  if (!item) return fail("Item nahi mila.");

  const existing = await prisma.expense.findUnique({
    where: { budgetItemId: item.id },
  });

  if (existing) {
    await prisma.expense.delete({ where: { id: existing.id } });
    refresh();
    return done(`"${item.name}" wapas pending kar diya`);
  }

  const date = DATE_RE.test(input.date ?? "") ? (input.date as string) : todayISO();
  await prisma.expense.create({
    data: {
      userId: user.id,
      date,
      item: item.name,
      amount: item.amount,
      categoryKey: item.categoryKey,
      budgetItemId: item.id,
    },
  });
  refresh();
  return done(`"${item.name}" expense mein add ho gaya (${date})`);
}

/* -------------------------------------------------------------- expenses */

export async function addExpense(input: {
  date: string;
  item: string;
  amount: number;
  categoryKey: string;
  note?: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const item = input.item?.trim() ?? "";
  const amount = Number(input.amount);
  if (!item) return fail("Item ka naam zaroori hai.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount 0 se zyada hona chahiye.");
  if (!DATE_RE.test(input.date ?? "")) return fail("Sahi date dalein.");

  const keys = await activeCategoryKey(user.id);
  if (!keys.includes(input.categoryKey)) return fail("Category select karein.");

  await prisma.expense.create({
    data: {
      userId: user.id,
      date: input.date,
      item,
      amount,
      categoryKey: input.categoryKey,
      note: input.note?.trim() || null,
    },
  });
  refresh();
  return done("Expense add ho gayi");
}

export async function updateExpense(input: {
  id: string;
  date: string;
  item: string;
  amount: number;
  categoryKey: string;
  note?: string;
}): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const expense = await prisma.expense.findFirst({ where: { id: input.id, userId: user.id } });
  if (!expense) return fail("Expense nahi mili.");

  const item = input.item?.trim() ?? "";
  const amount = Number(input.amount);
  if (!item) return fail("Item ka naam zaroori hai.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount 0 se zyada hona chahiye.");
  if (!DATE_RE.test(input.date ?? "")) return fail("Sahi date dalein.");

  const keys = await activeCategoryKey(user.id);
  const categoryKey = keys.includes(input.categoryKey) ? input.categoryKey : expense.categoryKey;

  await prisma.expense.update({
    where: { id: expense.id },
    data: {
      date: input.date,
      item,
      amount,
      categoryKey,
      note: input.note?.trim() || null,
    },
  });
  refresh();
  return done("Expense update ho gayi");
}

export async function deleteExpense(input: { id: string }): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  const expense = await prisma.expense.findFirst({ where: { id: input.id, userId: user.id } });
  if (!expense) return fail("Expense nahi mili.");

  await prisma.expense.delete({ where: { id: expense.id } });
  refresh();
  return done("Expense delete ho gayi");
}

/* ------------------------------------------------------ import / export */

export interface BackupPayload {
  version: number;
  exportedAt?: string;
  rules: {
    name: string;
    isActive: boolean;
    categories: { label: string; percent: number; color: string }[];
  }[];
  plans: { month: string; income: number }[];
  items: {
    /** original id so expense ↔ item links survive a restore */
    id?: string;
    month: string;
    name: string;
    amount: number;
    categoryKey: string;
  }[];
  expenses: {
    date: string;
    item: string;
    amount: number;
    categoryKey: string;
    note?: string | null;
    /** original id of the planned item this expense came from */
    budgetItemId?: string | null;
  }[];
}

export async function importBackup(payload: BackupPayload): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  if (!payload || typeof payload !== "object") return fail("File ka format sahi nahi hai.");
  const rules = Array.isArray(payload.rules) ? payload.rules : [];
  const plans = Array.isArray(payload.plans) ? payload.plans : [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const expenses = Array.isArray(payload.expenses) ? payload.expenses : [];

  if (rules.length === 0 && plans.length === 0 && items.length === 0 && expenses.length === 0) {
    return fail("Backup mein data nahi mila.");
  }

  for (const rule of rules) {
    const problem = validateRule(rule.name ?? "", rule.categories ?? []);
    if (problem) return fail(`Backup rule "${rule.name ?? "?"}": ${problem}`);
  }

  let activated = false;
  await prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany({ where: { userId: user.id } });
    await tx.budgetItem.deleteMany({ where: { userId: user.id } });
    await tx.monthPlan.deleteMany({ where: { userId: user.id } });
    await tx.rule.deleteMany({ where: { userId: user.id } });

    for (const rule of rules) {
      const keys = buildCategoryKeys(rule.categories.map((c) => c.label));
      const isActive = !activated && (rule.isActive || rules.length === 1);
      if (isActive) activated = true;
      await tx.rule.create({
        data: {
          userId: user.id,
          name: rule.name.trim(),
          isActive,
          categories: {
            create: rule.categories.map((c, i) => ({
              key: keys[i],
              label: c.label.trim(),
              percent: Math.round(c.percent),
              color: isColorToken(c.color) ? c.color : "indigo",
              order: i,
            })),
          },
        },
      });
    }
    if (!activated) {
      const first = await tx.rule.findFirst({ where: { userId: user.id } });
      if (first) await tx.rule.update({ where: { id: first.id }, data: { isActive: true } });
    }

    const planIds = new Map<string, string>();
    for (const plan of plans) {
      if (!MONTH_RE.test(plan.month)) continue;
      const created = await tx.monthPlan.create({
        data: { userId: user.id, month: plan.month, income: Number(plan.income) || 0 },
      });
      planIds.set(plan.month, created.id);
    }

    const itemIds = new Map<string, string>();
    for (const item of items) {
      if (!MONTH_RE.test(item.month)) continue;
      let planId = planIds.get(item.month);
      if (!planId) {
        const created = await tx.monthPlan.create({
          data: { userId: user.id, month: item.month, income: 0 },
        });
        planId = created.id;
        planIds.set(item.month, planId);
      }
      const created = await tx.budgetItem.create({
        data: {
          userId: user.id,
          planId,
          name: String(item.name ?? "").slice(0, 120),
          amount: Number(item.amount) || 0,
          categoryKey: item.categoryKey ?? "basic",
        },
      });
      if (item.id) itemIds.set(item.id, created.id);
    }

    for (const expense of expenses) {
      if (!DATE_RE.test(expense.date)) continue;
      const linked = expense.budgetItemId
        ? (itemIds.get(expense.budgetItemId) ?? null)
        : null;
      await tx.expense.create({
        data: {
          userId: user.id,
          date: expense.date,
          item: String(expense.item ?? "").slice(0, 120),
          amount: Number(expense.amount) || 0,
          categoryKey: expense.categoryKey ?? "basic",
          note: expense.note ? String(expense.note).slice(0, 240) : null,
          budgetItemId: linked,
        },
      });
    }
  });

  refresh();
  return done("Backup restore ho gaya");
}

export async function resetAllData(): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  await prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany({ where: { userId: user.id } });
    await tx.budgetItem.deleteMany({ where: { userId: user.id } });
    await tx.monthPlan.deleteMany({ where: { userId: user.id } });
    await tx.rule.deleteMany({ where: { userId: user.id } });
  });

  for (const rule of DEFAULT_RULES) {
    const keys = buildCategoryKeys(rule.categories.map((c) => c.label));
    await prisma.rule.create({
      data: {
        userId: user.id,
        name: rule.name,
        isActive: rule.isActive,
        categories: {
          create: rule.categories.map((c, i) => ({
            key: keys[i],
            label: c.label,
            percent: c.percent,
            color: c.color,
            order: i,
          })),
        },
      },
    });
  }

  refresh();
  return done("Saara data reset ho gaya");
}

export async function deleteAccount(): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("Session expire ho gaya — dobara login karein.");

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  refresh();
  return done("Account delete ho gaya");
}
