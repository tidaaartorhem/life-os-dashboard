# Life OS Dashboard

A personal operating system for your life — tasks, goals, habits, calendar, finance, and focus time in one premium dashboard.

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM** (SQLite locally, Postgres-ready), **@dnd-kit**, and **Recharts**.

## Features

- **Dashboard** — today's focus list, due-today/overdue stats, habit streaks, active goals, and this month's income vs. spending.
- **Tasks** — Kanban board with drag-and-drop (@dnd-kit) plus a filterable list view; statuses, priorities, projects, tags, due dates, time estimates.
- **Goals** — goals with milestones and linked tasks; progress auto-computed from completed tasks.
- **Calendar** — month / week / day views, event CRUD, drag events between days to reschedule.
- **Analytics** — task completion trends, status/priority breakdowns, focus-time charts, spending by category, 4-week habit adherence heatmap.

## Quick start

```bash
npm install
npm run db:migrate   # apply migrations to dev.db
npm run db:seed      # seed a demo user with realistic data
npm run dev          # http://localhost:3000
```

Demo credentials: sign in is mocked — the seeded user is **demo@lifeos.app**. No password required.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / production server |
| `npm run db:generate` | Generate a Drizzle migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations (`./db/migrations`) |
| `npm run db:seed` | Seed demo data (idempotent) |
| `npm test` | Vitest unit + integration suite |
| `npm run test:e2e` | Playwright end-to-end suite |

## Architecture

```
app/                # Next.js App Router — pages, layouts, loading/error states
app/actions/        # Server actions (thin wrappers over services + revalidatePath)
components/
  ui/               # Design system: button, card, dialog, input, badge, ...
  layout/           # App shell: sidebar nav, mobile drawer, top bar
  tasks/ goals/ calendar/ analytics/ dashboard/   # Feature components
services/           # All data access: tasks, goals, habits, events, insights, misc
db/                 # Drizzle schema, migrations, seed script
lib/                # db client, mock auth, zod validations, date utils
types/              # Shared DTOs, labels, status/priority types
tests/
  unit/             # Vitest: date utils, zod schemas
  integration/      # Vitest: services against isolated temp SQLite DBs
  e2e/              # Playwright: full goal journey in a real browser
```

**Layering rule:** UI components never touch the database — every read/write goes through `services/` via React Server Components or server actions. All writes are validated with Zod (`lib/validations.ts`).

## Database

Local development uses **SQLite** via `better-sqlite3` — zero external services, migrations in `db/migrations/`, data in `dev.db` (gitignored).

**Postgres path:** the app is written so swapping databases only touches `lib/db.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export const db = drizzle(postgres(process.env.DATABASE_URL!), { schema });
```

then generate Postgres migrations with `drizzle-kit generate --dialect=postgresql`. Every service takes the `DbClient` type, so no other code changes.

## Auth

Authentication is a mocked single-user session (`lib/auth.ts` → `getDemoUserId()`), so the app is fully usable without an auth provider. To add real auth, replace `getDemoUserId()` with your session lookup (e.g. Auth.js) and pass the real user id into the services — they already scope every query by `userId`.

## Testing

- **Unit** (`tests/unit`): date utilities, Zod validation schemas.
- **Integration** (`tests/integration`): every service (tasks, goals, habits, events, transactions, notes, focus, insights) runs against a fresh temp SQLite database — migrations applied per test.
- **E2E** (`tests/e2e`): Playwright drives the acceptance journey in Chromium — create goal → add milestone → link task with due date → complete task → goal hits 100% → dashboard reflects it.

```bash
npm test          # 39 tests, ~10s
npm run test:e2e  # needs: npx playwright install chromium --only-shell
```

## Environment

Copy `.env.example` to `.env` to override defaults:

```
DATABASE_URL=file:./dev.db
```

## License

MIT
