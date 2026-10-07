export type CategoryId = "basic" | "wants" | "loans";

export interface BudgetItem {
  id: string;
  name: string;
  category: CategoryId;
  amount: number;
}

export interface Expense {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  item: string;
  amount: number;
  category: CategoryId;
  note?: string;
}

export interface MonthPlan {
  income: number;
  items: BudgetItem[];
}

export interface AppState {
  version: number;
  currency: string;
  /** YYYY-MM */
  selectedMonth: string;
  plans: Record<string, MonthPlan>;
  expenses: Expense[];
}
