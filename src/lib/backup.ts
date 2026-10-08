"use client";

import { useRef } from "react";
import type { BackupPayload } from "./actions";
import type { Workspace } from "./types";

/** Build a backup object from the loaded workspace and download it. */
export function downloadBackup(workspace: Workspace, month?: string): void {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    rules: workspace.rules.map((rule) => ({
      name: rule.name,
      isActive: rule.isActive,
      categories: rule.categories.map((c) => ({
        label: c.label,
        percent: c.percent,
        color: c.color,
      })),
    })),
    plans: workspace.plans.map((p) => ({ month: p.month, income: p.income })),
    items: workspace.items.map((item) => ({
      id: item.id,
      month: item.month,
      name: item.name,
      amount: item.amount,
      categoryKey: item.categoryKey,
    })),
    expenses: workspace.expenses.map((expense) => ({
      date: expense.date,
      item: expense.item,
      amount: expense.amount,
      categoryKey: expense.categoryKey,
      note: expense.note,
      budgetItemId: expense.budgetItemId,
    })),
  };

  const stamp = month ?? new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mudget-backup-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Open a file picker, parse the JSON backup and hand it to `onData`. */
export function pickBackup(onData: (payload: BackupPayload) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupPayload;
      onData(parsed);
    } catch {
      onData(null as unknown as BackupPayload);
    }
  };
  input.click();
}
