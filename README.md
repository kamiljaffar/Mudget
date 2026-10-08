# Mudget

Mobile-first monthly budget tracker — income, daily expenses, planned items and
**your own budget rules** (60/25/15 is just the default), synced to a Neon
Postgres database so you can sign in from any device.

**Live:** https://mudget-rho.vercel.app · **Repo:** https://github.com/kamiljaffar/Mudget

## Features

| Area | What it does |
| --- | --- |
| **Auth** | Email + password signup/login, scrypt-hashed passwords, JWT cookie session (30 days), profile page (name, currency, avatar colour, password change, delete account). |
| **Storage** | Neon Postgres + Prisma. Tables: `User`, `Rule`, `RuleCategory`, `MonthPlan`, `BudgetItem`, `Expense`. Nothing lives in `localStorage` anymore — but a one-tap **import banner** migrates data from the old browser-only version. |
| **Rules** | The Budget tab manages rules: 60/25/15 ships active, 50/30/20 ships inactive. Create your own (name + N categories, labels, percentages, colours, total must be 100 %) and hit **Apply this rule** — every calculation in the app follows the active rule. |
| **Planned items → expense** | Each budget item has a tick. Ticking it creates **that day's expense** for the same name/amount/category (unique link, badge `expense added`); unticking removes it. |
| **Daily Log** | Add/edit/delete expenses with date, amount, category (from the active rule) and note; search + category filter chips. |
| **Reports** | Per-item cost (how often and how much the same thing was bought, vs its budget), daily spending chart, rule-split bar. |
| **Backup** | JSON **Export/Import** in Budget + Profile (full replace, keeps expense ↔ item links), plus reset. Data is also synced in the database. |
| **UI** | Tailwind CSS 4 + framer-motion: animated nav pills, staggered lists, spring modals, animated progress bars, toasts, gradient hero cards. Fully responsive with a bottom tab bar on mobile. |

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4** · **framer-motion** · **lucide-react**
- **Neon Postgres** + **Prisma** (separate `mudget` database in the Neon project)
- **jose** for JWT sessions, **node:crypto scrypt** for password hashing — no third-party auth provider

## Getting started

```bash
npm install
cp .env.example .env      # then fill DATABASE_URL / DIRECT_URL / JWT_SECRET
npm run db:push           # creates the tables (uses DIRECT_URL)
npm run dev
```

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run db:push`,
`npm run db:studio`.

`.env` needs:

```
DATABASE_URL="postgresql://…-pooler…/mudget?sslmode=require"   # app queries
DIRECT_URL="postgresql://…/mudget?sslmode=require"              # prisma db push
JWT_SECRET="<long random hex>"
```

> `DATABASE_URL` points at the Neon **pooler** endpoint and `DIRECT_URL` at the
> direct endpoint — Prisma Migrate/`db push` refuses to run over PgBouncer, so
> the schema is pushed through `DIRECT_URL`.

## Structure

```
prisma/schema.prisma        data model
src/app/(app)/…             authenticated pages (layout guards with requireUser)
src/app/login, signup       public auth pages
src/lib/auth.ts             password hashing + JWT session cookie
src/lib/actions.ts          all server actions (auth, rules, items, expenses, backup)
src/lib/workspace.ts        loads one user's workspace (cached per request)
src/lib/calc.ts             rule-aware calculations
src/lib/palette.ts          category colour tokens
src/components/*View.tsx    client views
```

Pages are thin server components that load the workspace and pass it to a client
view; mutations run through server actions and `router.refresh()`.

## Notes

- **Icons:** imported from deep `lucide-react/icons/<name>` paths via
  `src/components/icons.ts` to dodge the Next.js `optimizePackageImports`
  barrel bug (vercel/next.js#54967).
- **Never** turn the `(app)` page files into client components — the auth guard
  and data loading must stay server-side.
- Deploy: Vercel Git integration on `main` (framework `nextjs` via
  `vercel.json`).
