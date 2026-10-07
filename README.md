# Mudget — Monthly Budget Tracker

A small, mobile-first web app for managing a **monthly budget by hand**: set the month's
income, write down your pre-defined budget items, then log every daily expense. Each
expense is deducted from one of three categories so you always know how much is left.

## The 60 / 25 / 15 rule

| Category          | Share | Typical use                          |
| ----------------- | ----- | ------------------------------------ |
| **Basic**         | 60 %  | Rent, groceries, utilities, transport |
| **Wants**         | 25 %  | Shopping, eating out, fun, subscriptions |
| **Loans / Investments** | 15 % | Debt payments, savings, investments |

The limits are calculated from the month's income (`income × 60 %`, etc.). Daily expenses
are deducted from the category you assign them to, so every category shows:

- **limit** (rule share of income)
- **planned** (sum of your pre-defined budget items)
- **spent** (sum of the daily log)
- **remaining** (limit − spent)

## Tabs

1. **Dashboard** — overview: income, spent, remaining, projected spend, per-category
   progress, the 60/25/15 bar, recent activity and top spending items.
2. **Daily Log** — add/edit/delete expenses (date, item, amount, category, note). If the
   item name matches a pre-defined budget item, the category is picked automatically.
   Entries are grouped by day with a per-day total.
3. **Reports** — **cost per item**: every purchase of the same item is merged into one row
   showing total spent, purchase count, average cost and progress against its budget.
   Also includes a daily spending chart and the category breakdown.
4. **Monthly Budget** — monthly income, currency, the pre-defined budget items grouped by
   category (with warnings when a category is planned over its 60/25/15 limit), plus
   backup (export/import JSON) and reset.

## Tech

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- `lucide-react` icons
- **No database, no login** — all data lives in the browser's `localStorage`
  (key `mudget.state.v1`). Use *Monthly Budget → Export JSON* for a backup.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

The project is a plain Next.js app, so Vercel needs no configuration:

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repository.
3. Click **Deploy** — framework preset *Next.js* is detected automatically.

Or from the CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

## Project structure

```
src/
  app/                 # routes (thin server pages)
    dashboard|log|reports|budget/page.tsx
  components/
    AppShell.tsx       # header + mobile bottom navigation
    MonthSwitcher.tsx  # month picker used by every tab
    DashboardView.tsx  # client view: dashboard tab
    LogView.tsx        # client view: daily log tab
    ReportsView.tsx    # client view: reports tab
    BudgetView.tsx     # client view: monthly budget tab
    icons.ts           # lucide icons (deep imports, see note below)
    ui.tsx             # shared UI atoms (Card, Chip, ProgressBar…)
  lib/
    types.ts           # AppState / Expense / BudgetItem models
    categories.ts      # the three categories + their rule percentages
    calc.ts            # 60/25/15 calculations, per-item and per-day stats
    store.tsx          # React context + localStorage persistence
    format.ts          # money/date helpers
```

### Note on `components/icons.ts`

Icons are imported from `lucide-react/icons/<name>` instead of the `lucide-react` barrel.
Next.js enables `optimizePackageImports` for lucide-react automatically, and that barrel
optimizer has a known bug that can break `next build`
([vercel/next.js#54967](https://github.com/vercel/next.js/issues/54967)). Deep imports
bypass it.
