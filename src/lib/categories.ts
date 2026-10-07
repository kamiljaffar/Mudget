import type { CategoryId } from "./types";

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  short: string;
  percent: number;
  hint: string;
  /** tailwind background class for the progress bar */
  bar: string;
  /** tailwind text class */
  text: string;
  /** tailwind chip class (bg / text / ring) */
  chip: string;
  /** tailwind card accent class */
  card: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "basic",
    label: "Basic",
    short: "Basic",
    percent: 60,
    hint: "Rent, groceries, utilities, transport",
    bar: "bg-sky-500",
    text: "text-sky-600",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    card: "border-sky-200",
  },
  {
    id: "wants",
    label: "Wants",
    short: "Wants",
    percent: 25,
    hint: "Shopping, eating out, fun, subscriptions",
    bar: "bg-amber-500",
    text: "text-amber-600",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    card: "border-amber-200",
  },
  {
    id: "loans",
    label: "Loans / Investments",
    short: "Loans",
    percent: 15,
    hint: "Debt payments, savings, investments",
    bar: "bg-violet-500",
    text: "text-violet-600",
    chip: "bg-violet-50 text-violet-700 ring-violet-200",
    card: "border-violet-200",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryInfo> = CATEGORIES.reduce(
  (acc, info) => {
    acc[info.id] = info;
    return acc;
  },
  {} as Record<CategoryId, CategoryInfo>,
);

export const RULE_TOTAL = CATEGORIES.reduce((sum, c) => sum + c.percent, 0);
