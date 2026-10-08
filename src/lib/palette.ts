/**
 * Colour tokens for rule categories.
 * Only the token is stored in the database, the Tailwind classes live here
 * (literal strings so Tailwind can see them while scanning).
 */

const make = (bar: string, text: string, chip: string, card: string, soft: string) => ({
  bar,
  text,
  chip,
  card,
  soft,
});

export const PALETTE = {
  sky: make("bg-sky-500", "text-sky-600", "bg-sky-50 text-sky-700 ring-sky-200", "border-sky-200", "bg-sky-50"),
  amber: make("bg-amber-500", "text-amber-600", "bg-amber-50 text-amber-700 ring-amber-200", "border-amber-200", "bg-amber-50"),
  violet: make("bg-violet-500", "text-violet-600", "bg-violet-50 text-violet-700 ring-violet-200", "border-violet-200", "bg-violet-50"),
  emerald: make("bg-emerald-500", "text-emerald-600", "bg-emerald-50 text-emerald-700 ring-emerald-200", "border-emerald-200", "bg-emerald-50"),
  indigo: make("bg-indigo-500", "text-indigo-600", "bg-indigo-50 text-indigo-700 ring-indigo-200", "border-indigo-200", "bg-indigo-50"),
  rose: make("bg-rose-500", "text-rose-600", "bg-rose-50 text-rose-700 ring-rose-200", "border-rose-200", "bg-rose-50"),
  teal: make("bg-teal-500", "text-teal-600", "bg-teal-50 text-teal-700 ring-teal-200", "border-teal-200", "bg-teal-50"),
  orange: make("bg-orange-500", "text-orange-600", "bg-orange-50 text-orange-700 ring-orange-200", "border-orange-200", "bg-orange-50"),
  fuchsia: make("bg-fuchsia-500", "text-fuchsia-600", "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200", "border-fuchsia-200", "bg-fuchsia-50"),
  lime: make("bg-lime-500", "text-lime-600", "bg-lime-50 text-lime-700 ring-lime-200", "border-lime-200", "bg-lime-50"),
} as const;

export type ColorToken = keyof typeof PALETTE;

export const COLOR_TOKENS = Object.keys(PALETTE) as ColorToken[];

export function isColorToken(value: string | undefined | null): value is ColorToken {
  return typeof value === "string" && value in PALETTE;
}

export function colorToken(color: string | undefined | null): ColorToken {
  return isColorToken(color) ? color : "indigo";
}

export function colorStyle(color: string): (typeof PALETTE)[ColorToken] {
  return PALETTE[colorToken(color)];
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
