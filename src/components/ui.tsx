"use client";

import clsx from "clsx";
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export const selectClass = clsx(inputClass, "appearance-none pr-8");

export const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 active:scale-[0.98]";

/* ------------------------------------------------------------- motion */

export const EASE = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its direct motion children on mount. */
export function Stagger({
  children,
  className,
  gap = 0.06,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------- layout */

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        hover &&
          "transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  percent,
  barClass,
  trackClass = "bg-slate-100",
  delay = 0,
}: {
  percent: number;
  barClass: string;
  trackClass?: string;
  delay?: number;
}) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={clsx("h-2.5 w-full overflow-hidden rounded-full", trackClass)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={clsx("h-full rounded-full", barClass)}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      />
    </div>
  );
}

export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        className ?? "bg-slate-50 text-slate-600 ring-slate-200",
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "text-slate-900",
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  accent?: string;
  icon?: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-50" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon ? <span className="text-indigo-400">{icon}</span> : null}
      </div>
      <p className={clsx("mt-2 text-xl font-bold tracking-tight sm:text-2xl", accent)}>
        {value}
      </p>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </motion.div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-slate-300">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/45 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer ? (
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white/95 px-5 py-3.5 backdrop-blur">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------- bits */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}
