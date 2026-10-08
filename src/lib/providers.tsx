"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { CheckCircle2, XCircle, X } from "@/components/icons";
import { currentMonth } from "./format";

/* ------------------------------------------------------------- month ctx */

const MONTH_KEY = "mudget.selectedMonth";

interface MonthContextValue {
  month: string;
  setMonth: (month: string) => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonthState] = useState<string>(() => currentMonth());

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MONTH_KEY);
      if (stored && /^\d{4}-\d{2}$/.test(stored)) setMonthState(stored);
    } catch {
      /* storage blocked — ignore */
    }
  }, []);

  const setMonth = useCallback((next: string) => {
    setMonthState(next);
    try {
      window.localStorage.setItem(MONTH_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ month, setMonth }), [month, setMonth]);
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth(): MonthContextValue {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used inside <AppProviders>");
  return ctx;
}

/* ------------------------------------------------------------- toasts */

export type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastContextValue {
  notify: (text: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (text: string, kind: ToastKind = "success") => {
      counter.current += 1;
      const id = counter.current;
      setItems((prev) => [...prev.slice(-2), { id, kind, text }]);
      window.setTimeout(() => remove(id), 3600);
    },
    [remove],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={clsx(
                "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-xl ring-1",
                item.kind === "success"
                  ? "bg-slate-900 text-white ring-slate-700"
                  : "bg-rose-600 text-white ring-rose-500",
              )}
            >
              {item.kind === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-white/80" />
              )}
              <span>{item.text}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => remove(item.id)}
                className="ml-1 rounded-full p-0.5 text-white/50 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <AppProviders>");
  return ctx;
}

/* ------------------------------------------------------------- shell */

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <MonthProvider>{children}</MonthProvider>
    </ToastProvider>
  );
}
