# CTC Hub

Church management for Christ Treasure Centre (Treasure City), starting at the Yaba branch.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + Neon PostgreSQL
- Auth.js (email/password)
- TanStack Query
- Zod validation
- Husky + commitlint
- Knip

## Setup

1. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — Neon development connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `SEED_ADMIN_PASSWORD`
2. Install and migrate:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for seeding, Mailtrap, commit conventions, and pull requests.

## Scripts

- `pnpm dev` — local app
- `pnpm typecheck` / `pnpm lint` / `pnpm knip`
- `pnpm db:studio` — inspect data

Commits must follow Conventional Commits (`feat`, `fix`, `chore`, …) via Husky + commitlint.
