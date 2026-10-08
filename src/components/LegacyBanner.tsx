"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Database, Sparkles, X } from "@/components/icons";
import { importBackup, updateProfile, type BackupPayload } from "@/lib/actions";
import { useToast } from "@/lib/providers";
import { useAction } from "@/lib/useAction";
import type { Workspace } from "@/lib/types";

const LEGACY_KEY = "mudget.state.v1";
const DISMISS_KEY = "mudget.legacy.dismissed";

interface LegacyState {
  currency?: string;
  plans?: Record<
    string,
    {
      income?: number;
      items?: {
        id?: string;
        name?: string;
        category?: string;
        amount?: number;
      }[];
    }
  >;
  expenses?: {
    id?: string;
    date?: string;
    item?: string;
    amount?: number;
    category?: string;
    note?: string;
  }[];
}

/** Old localStorage categories ("basic" | "wants" | "loans") → active rule keys. */
function keyMapper(workspace: Workspace): (category?: string) => string {
  const cats = workspace.activeRule?.categories ?? [];
  const legacy: Record<string, string> = {
    basic: cats[0]?.key ?? "basic",
    wants: cats[1]?.key ?? cats[0]?.key ?? "wants",
    loans: cats[2]?.key ?? cats[1]?.key ?? cats[0]?.key ?? "loans",
  };
  return (category) =>
    legacy[category ?? ""] ??
    (cats.find((c) => c.key === category)?.key ?? cats[0]?.key ?? "basic");
}

function convert(raw: string, workspace: Workspace): BackupPayload | null {
  try {
    const parsed = JSON.parse(raw) as LegacyState;
    const mapKey = keyMapper(workspace);

    const planEntries = Object.entries(parsed.plans ?? {});
    const plans = planEntries.map(([month, plan]) => ({
      month,
      income: Number(plan.income) || 0,
    }));

    const items: BackupPayload["items"] = [];
    for (const [month, plan] of planEntries) {
      for (const item of plan.items ?? []) {
        if (!item.name) continue;
        items.push({
          month,
          name: item.name,
          amount: Number(item.amount) || 0,
          categoryKey: mapKey(item.category),
        });
      }
    }

    const expenses: BackupPayload["expenses"] = [];
    for (const expense of parsed.expenses ?? []) {
      if (!expense.date || !expense.item) continue;
      expenses.push({
        date: expense.date,
        item: expense.item,
        amount: Number(expense.amount) || 0,
        categoryKey: mapKey(expense.category),
        note: expense.note ?? null,
      });
    }

    if (plans.length === 0 && items.length === 0 && expenses.length === 0) {
      return null;
    }

    return {
      version: 1,
      rules: workspace.rules.map((rule) => ({
        name: rule.name,
        isActive: rule.isActive,
        categories: rule.categories.map((c) => ({
          label: c.label,
          percent: c.percent,
          color: c.color,
        })),
      })),
      plans,
      items,
      expenses,
    };
  } catch {
    return null;
  }
}

/**
 * The first version of Mudget stored everything in localStorage.
 * Offer a one-tap migration into the database on the first signed-in visit.
 */
export function LegacyBanner({ workspace }: { workspace: Workspace }) {
  const { notify } = useToast();
  const [payload, setPayload] = useState<BackupPayload | null>(null);
  const legacyCurrency = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);

  const restore = useAction(importBackup);
  const saveProfile = useAction(updateProfile);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY)) return;
      const raw = window.localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const converted = convert(raw, workspace);
      if (!converted) return;
      const parsed = JSON.parse(raw) as LegacyState;
      legacyCurrency.current = parsed.currency ?? null;
      setPayload(converted);
      setVisible(true);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible || !payload) return null;

  async function importNow() {
    if (!payload) return;
    const result = await restore.run(payload);
    if (result?.ok) {
      if (
        legacyCurrency.current &&
        legacyCurrency.current !== workspace.profile.currency
      ) {
        await saveProfile.run({
          name: workspace.profile.name,
          currency: legacyCurrency.current,
          avatarColor: workspace.profile.avatarColor,
        });
      }
      try {
        window.localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
      notify("Purana browser data import ho gaya!", "success");
      setVisible(false);
    }
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-lg rounded-3xl border border-indigo-200 bg-white p-4 shadow-2xl shadow-indigo-900/20 sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
              <Database className="h-5 w-5" />
            </span>
            <div className="pr-6">
              <p className="text-sm font-bold text-slate-900">
                Is browser ka purana data mila
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Local storage mein pehle ka budget data hai. Import kar dein to woh
                ab aapke account mein har device pe milega.
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={importNow}
              disabled={restore.busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/30 transition active:scale-[0.98] disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {restore.busy ? "Importing…" : "Import data"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              Baad mein
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
