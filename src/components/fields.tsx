"use client";

import clsx from "clsx";
import type { CategoryInfo } from "@/lib/calc";
import { selectClass } from "./ui";

/** Category <select> built from the active rule's categories. */
export function CategorySelect({
  categories,
  value,
  onChange,
  allowOther = false,
  otherLabel = "Other (rule se bahar)",
}: {
  categories: CategoryInfo[];
  value: string;
  onChange: (key: string) => void;
  allowOther?: boolean;
  otherLabel?: string;
}) {
  const known = categories.some((c) => c.key === value);
  const options = known
    ? categories
    : [...categories, { key: value, label: otherLabel } as CategoryInfo];

  return (
    <div className="relative">
      <select
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((category) => (
          <option key={category.key} value={category.key}>
            {category.label}
            {typeof category.percent === "number" && category.percent > 0
              ? ` · ${category.percent}%`
              : ""}
          </option>
        ))}
      </select>
      <ChevronDownTail />
    </div>
  );
}

function ChevronDownTail() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Colour dot used in the rule editor. */
export function ColorDot({
  token,
  barClass,
  active,
  onClick,
}: {
  token: string;
  barClass: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Colour ${token}`}
      onClick={onClick}
      className={clsx(
        "grid h-7 w-7 place-items-center rounded-full transition",
        active ? "ring-2 ring-slate-900 ring-offset-2" : "hover:scale-110",
      )}
    >
      <span className={clsx("h-5 w-5 rounded-full", barClass)} />
    </button>
  );
}
