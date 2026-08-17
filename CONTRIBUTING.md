# Contributing to CTC Hub

Thanks for helping with CTC Hub, the church management app for Christ Treasure Centre (Treasure City).

This guide covers local setup, database seeding, mailing, and how we take changes.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 11 (pinned in `package.json` as `packageManager`)
- A Neon (or other PostgreSQL) **development** database

Use Corepack so you get pnpm 11 even if another copy is on your PATH:

```bash
corepack enable
corepack prepare pnpm@11.21.0 --activate
```

Do not point `DATABASE_URL` at production.

## First-time setup

```bash
pnpm install
cp .env.example .env
```

Fill `.env` (never commit this file):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Auth.js signing secret (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Keep `true` for local Auth.js |
| `NEXT_PUBLIC_APP_URL` | App URL, usually `http://localhost:3000` |
| `SEED_ADMIN_EMAIL` | Super admin email used by the seed |
| `SEED_ADMIN_PASSWORD` | Super admin password (at least 8 characters) |
| `MAILTRAP_API_TOKEN` | Mailtrap sending API token (staff invites) |
| `MAILTRAP_FROM_EMAIL` | Verified sender address |
| `MAILTRAP_SENDER_NAME` | Optional from name, defaults to CTC Hub |

Then:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Environment

Copy from [`.env.example`](.env.example). Keep secrets in `.env` only.

```bash
openssl rand -base64 32
```

Paste that value into `AUTH_SECRET`. Restart `pnpm dev` after any env change.

### Mailtrap (staff onboarding)

Only a **SUPER_ADMIN** can onboard staff. CTC Hub emails a temporary password via the [Mailtrap sending API](https://docs.mailtrap.io/developers/email-sending/transactional); the new user must reset it on first sign-in.

Set these when you want invites to send. The from address must be on a verified Mailtrap sending domain.

```bash
MAILTRAP_API_TOKEN=
MAILTRAP_FROM_EMAIL=hello@yourdomain.com
MAILTRAP_SENDER_NAME=CTC Hub
```

Get the token from [Mailtrap sending setup](https://mailtrap.io/api-smtp/sending-setup). If Mailtrap is missing, onboarding fails and the user is not created.

## Database

We use Prisma migrations only — not `prisma db push`.

| Command | What it does |
| --- | --- |
| `pnpm db:generate` | Regenerate the Prisma Client after schema changes |
| `pnpm db:migrate` | Create/apply migrations in development (`prisma migrate dev`) |
| `pnpm db:seed` | Run [`prisma/seed.ts`](prisma/seed.ts) |
| `pnpm db:studio` | Open Prisma Studio |

Schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). New SQL goes under `prisma/migrations/`.

### Seeding

`pnpm db:seed` upserts:

1. Organization **Christ Treasure Centre**
2. Branch **Yaba** (`slug: yaba`)
3. A **SUPER_ADMIN** user

Defaults if env vars are omitted:

- Email: `admin@treasurecity.org`
- Password: `SEED_ADMIN_PASSWORD` (set this in `.env`; login requires at least 8 characters)

The seed is safe to re-run. It updates that admin’s name, password hash, role, Yaba branch, and `mustChangePassword: false`.

After a fresh database:

```bash
pnpm db:migrate
pnpm db:seed
```

On a deployed database, apply with `pnpm exec prisma migrate deploy`, then seed if you need the first super admin.

## Project layout

Keep `app/` at the repo root (no `src/`).

- `app/(auth)` — login and reset password
- `app/(dashboard)` — members, first timers, soul tracker, events, settings
- `app/api` — Route Handlers; validate bodies with Zod
- `components/ui` — shadcn/ui primitives
- `lib/auth`, `lib/validation`, `lib/mail`, `lib/db`
- `proxy.ts` — Auth.js session gate (Next.js 16; not `middleware.ts`)

Client lists and mutations use **TanStack Query**. Do not add ad-hoc `fetch` + `useEffect` for API data.

## Roles

| Role | Notes |
| --- | --- |
| `SUPER_ADMIN` | All branches, onboard staff, switch branch |
| `ADMIN` | Branch admin (cannot onboard users) |
| `PASTOR` | Read-heavy |
| `USHER` | Register people; cannot edit members |
| `FOLLOW_UP` | First-timer pipeline and soul tracker updates |

## Making a change

1. Create a branch from `main` / `master`.
2. Implement with existing UI primitives (`Button`, `Input`, `Table`, `Sheet`, and so on).
3. Validate API and form input with Zod schemas in [`lib/validation/schemas.ts`](lib/validation/schemas.ts).
4. Before you commit:

```bash
pnpm typecheck
pnpm lint
pnpm knip
pnpm format
```

5. Commit with Conventional Commits (Husky runs **lint** on pre-commit and **commitlint** on commit-msg).

### Commit messages

Format: `type: short description`

Allowed types (see [`commitlint.config.ts`](commitlint.config.ts)):

`feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `ci`, `build`, `revert`, `security`, `layout`, `pages`, `api`, `wip`, `translation`, `changeset`

Examples:

```text
feat: add staff onboarding email
fix: show red border on invalid inputs
docs: explain how to seed the database
```

Do not skip hooks (`--no-verify`) unless you have a strong reason.

Subject: lowercase, no period at the end, header max 100 characters.

## Pull requests

- Describe **why**, not only what changed.
- Note migrations, env vars, or seed changes.
- Confirm `pnpm typecheck`, `pnpm lint`, and `pnpm knip` pass.
- Do not commit `.env`, credentials, or dump files.

## What not to add

Password reset-by-email (beyond first-login forced reset), attendance/QR, reports, giving, file uploads, Express, or extra state libraries. TanStack Query + Route Handlers + Zod is the stack.

## Questions

If setup fails, check `DATABASE_URL`, `AUTH_SECRET`, and that migrations + seed have been applied. Mailtrap errors only matter when onboarding staff.
