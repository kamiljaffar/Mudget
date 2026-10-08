/** Plain data-transfer shapes handed from server components to client views. */

export interface CategoryDTO {
  key: string;
  label: string;
  percent: number;
  color: string;
}

export interface RuleDTO {
  id: string;
  name: string;
  isActive: boolean;
  categories: CategoryDTO[];
}

export interface PlanDTO {
  /** YYYY-MM */
  month: string;
  income: number;
}

export interface ItemDTO {
  id: string;
  /** YYYY-MM of the plan this item belongs to */
  month: string;
  name: string;
  amount: number;
  categoryKey: string;
  /** set while the "complete" tick is on */
  expenseId: string | null;
  createdAt: string;
}

export interface ExpenseDTO {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  item: string;
  amount: number;
  categoryKey: string;
  note: string | null;
  budgetItemId: string | null;
}

export interface ProfileDTO {
  id: string;
  email: string;
  name: string;
  currency: string;
  avatarColor: string;
  createdAt: string;
}

export interface Workspace {
  profile: ProfileDTO;
  rules: RuleDTO[];
  activeRule: RuleDTO | null;
  plans: PlanDTO[];
  items: ItemDTO[];
  expenses: ExpenseDTO[];
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };
