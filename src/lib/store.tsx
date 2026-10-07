"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { currentMonth, uid } from "./format";
import type { AppState, BudgetItem, Expense } from "./types";

const STORAGE_KEY = "mudget.state.v1";

export function defaultState(): AppState {
  return {
    version: 1,
    currency: "Rs",
    selectedMonth: currentMonth(),
    plans: {},
    expenses: [],
  };
}

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      plans: parsed.plans ?? base.plans,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    };
  } catch {
    return defaultState();
  }
}

export interface StoreValue {
  state: AppState;
  hydrated: boolean;
  setSelectedMonth: (month: string) => void;
  setCurrency: (currency: string) => void;
  setIncome: (month: string, income: number) => void;
  addBudgetItem: (month: string, item: Omit<BudgetItem, "id">) => void;
  updateBudgetItem: (
    month: string,
    id: string,
    patch: Partial<Omit<BudgetItem, "id">>,
  ) => void;
  removeBudgetItem: (month: string, id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (id: string) => void;
  replaceState: (next: AppState) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage after mount (keeps SSR + first client render identical)
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full / private mode - ignore
    }
  }, [state, hydrated]);

  const patchPlan = useCallback(
    (month: string, updater: (plan: AppState["plans"][string]) => AppState["plans"][string]) => {
      setState((prev) => {
        const existing = prev.plans[month] ?? { income: 0, items: [] };
        return { ...prev, plans: { ...prev.plans, [month]: updater(existing) } };
      });
    },
    [],
  );

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      setSelectedMonth: (month) => setState((prev) => ({ ...prev, selectedMonth: month })),
      setCurrency: (currency) => setState((prev) => ({ ...prev, currency })),
      setIncome: (month, income) =>
        patchPlan(month, (plan) => ({ ...plan, income: Number.isFinite(income) ? income : 0 })),
      addBudgetItem: (month, item) =>
        patchPlan(month, (plan) => ({ ...plan, items: [...plan.items, { ...item, id: uid() }] })),
      updateBudgetItem: (month, id, patch) =>
        patchPlan(month, (plan) => ({
          ...plan,
          items: plan.items.map((existing) =>
            existing.id === id ? { ...existing, ...patch } : existing,
          ),
        })),
      removeBudgetItem: (month, id) =>
        patchPlan(month, (plan) => ({
          ...plan,
          items: plan.items.filter((existing) => existing.id !== id),
        })),
      addExpense: (expense) =>
        setState((prev) => ({
          ...prev,
          expenses: [...prev.expenses, { ...expense, id: uid() }],
        })),
      updateExpense: (id, patch) =>
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((existing) =>
            existing.id === id ? { ...existing, ...patch } : existing,
          ),
        })),
      removeExpense: (id) =>
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((existing) => existing.id !== id),
        })),
      replaceState: (next) => setState({ ...defaultState(), ...next }),
      resetAll: () => setState(defaultState()),
    }),
    [state, hydrated, patchPlan],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useApp must be used inside <StoreProvider>");
  return ctx;
}
