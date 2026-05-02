# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs all apps concurrently)
pnpm dev

# Build
pnpm build

# Lint / format (Biome — not ESLint/Prettier)
pnpm lint          # check
pnpm lint:fix      # auto-fix
pnpm format        # format only

# Type checking
pnpm typecheck

# Tests (Vitest)
pnpm test
pnpm test:watch

# Run tests for a single package
pnpm --filter @myapp/web test
pnpm --filter @myapp/api test
pnpm --filter @myapp/utils test

# Database (local Supabase via Docker)
pnpm db:start            # start local Supabase
pnpm db:stop             # stop
pnpm db:reset            # reset + apply all migrations + seed.sql
pnpm db:seed:demo        # seed rich demo data (creates demo users)
pnpm db:gen-types        # regenerate packages/types/src/database.ts from local schema

# Prisma (API schema management)
pnpm --filter @myapp/api db:generate   # generate Prisma client (needed after schema changes)
pnpm --filter @myapp/api db:studio     # open Prisma Studio against local DB
pnpm --filter @myapp/api db:migrate    # run Prisma migrate dev (local only)
```

**Do not** run `prisma db push` against the production Supabase — it conflicts with the GoTrue `auth.*` schema. Production migrations go through `supabase db push` (via `supabase/migrations/*.sql`).

## Environment Setup

Copy `.env.example` → `.env` at the monorepo root. Key variables:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL (local: `http://127.0.0.1:54321`) |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (API only) |
| `DATABASE_URL` / `DIRECT_URL` | Postgres connection string (local: port 54322) |
| `VITE_API_URL` | tRPC server URL (local: `http://127.0.0.1:3000`) |

Local demo credentials (after `pnpm db:reset && pnpm db:seed:demo`): `user@hanover.test` / `admin@hanover.test`, password `HanoverTest123!`.

## Architecture

### Monorepo structure

```
apps/
  web/    — React 19 SPA (Vite, React Router 7, TanStack Query, Zustand, Tailwind 4)
  api/    — Node.js tRPC standalone server (Prisma, Supabase auth)
  admin/  — Separate React app (minimal, under development)
packages/
  types/  — Zod schemas + shared TypeScript types (including Prisma-generated DB types)
  ui/     — Shared React component library (TopNav, CMSChatbot, file-upload, etc.)
  utils/  — Pure utilities (formatDate, truncate, capitalize)
supabase/ — Supabase config, SQL migrations, seed.sql
```

### tRPC API

The API (`apps/api`) is a plain Node.js HTTP server wrapping tRPC. All data access flows through `apps/api/src/routers/index.ts`, which composes these routers:

| Router | Responsibility |
|---|---|
| `content` | Document CRUD, checkout/check-in, OCR trigger, favorites |
| `user` | Profile, access levels, user management (admin) |
| `notifications` | Activity feed, announcements, calendar events, per-user read/pin/delete state |
| `chat` | Gompei AI assistant conversations + messages |
| `employee` | Coworker directory |
| `audit` | Audit log queries |
| `metrics` | Usage metrics (admin) |
| `tag` | Global tag management |
| `login` | Auth helpers |

Three procedure tiers defined in `apps/api/src/lib/trpc.ts`:
- `publicProcedure` — no auth required, metrics tracked
- `protectedProcedure` — requires valid Supabase JWT
- `adminPortalProcedure` — requires `portal === "admin"` and `role === "admin"` in `UserProfile`

### Authentication

Supabase Auth issues JWTs. The web app (`apps/web/src/auth/session-context.tsx`) maintains the session and passes the Bearer token in every tRPC request header. The API context (`apps/api/src/context.ts`) resolves the token → Supabase user → Prisma `UserProfile`, with a 10-second in-memory cache per token to reduce DB lookups.

Two portals: `employee` (default) and `admin`. Employee roles include `underwriter`, `business-analyst`, and others stored in `UserProfile.role`. Admin users get access to user management, metrics, and announcement management.

### Database

Prisma schema is at `apps/api/prisma/schema.prisma`. Key application models:
- `UserProfile` — mirrors Supabase `auth.users` (1:1), adds `portal`, `role`, `photo_url`, etc.
- `ContentManagement` — documents with checkout state, OCR status, owner, tags, expiration/review dates
- `NotificationState` — per-user read/pin/delete state keyed by a `notificationKey` string (e.g. `change-<uuid>`, `announcement-<uuid>`)
- `Announcement` — admin-authored broadcasts with audience targeting by role
- `ChatConversation` / `ChatMessage` — Gompei assistant history
- `AuditEvent` — action log (upload, edit, delete, ownership-update)

The `auth.*` schema models are introspected into Prisma to avoid drift with GoTrue but are never modified by the application.

### Frontend patterns

The web app path alias `@/` maps to `apps/web/src/`. Pages live under `apps/web/src/pages/<name>/page.tsx`. The `ProtectedLayout` component in `App.tsx` handles auth guards, role-based nav, and passes `assistantContext` (current page, user role, workload summary) to the Gompei chatbot via React Router's outlet context.

tRPC client is initialized in `apps/web/src/lib/trpc.ts` as a React-Query integration. Router output types are exported as `RouterOutputs` for use across components.

### Notifications model

Notifications are not stored as rows — they are derived at query time by joining `AuditEvent` and `ContentManagement`. Per-user read/pin/delete state is persisted in `NotificationState` using a composite key `(userId, notificationKey)`. Announcements are separate (`Announcement` model with `listAnnouncements` endpoint).

### OCR pipeline

Document text extraction runs asynchronously. When content is uploaded, `enqueueOcr()` is called in `apps/api/src/services/ocr-queue.ts`. Status is tracked via `ContentManagement.ocr_status` (`pending` | `processing` | `done` | `error`). A backfill script exists at `apps/api/src/scripts/backfill-ocr.ts`.
