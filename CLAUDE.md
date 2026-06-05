# CLAUDE.md — orientation for AI agents

> **Audience:** Claude Code, Codex, Copilot, and any other LLM-driven agent dropped into this repository.
> **Goal:** give the agent enough context in one screen to start doing useful, safe work.

---

## What this is

`edd-app-template` is the production-ready SaaS starter for this workspace. It's a TanStack Start monolith with auth, AI, RBAC, i18n, and observability already wired. Derived apps clone the template, add a domain module, and ship.

The authoritative product / scope documents are:

- [`README.md`](README.md) — what's inside, how to bootstrap, scripts reference.
- [`SPEC.md`](SPEC.md) — acceptance criteria per module, tech stack, boundaries.
- [`PRODUCT.md`](PRODUCT.md) — personas, tone, anti-references.
- [`DESIGN.md`](DESIGN.md) — design tokens, components, layout rules.

Always read SPEC.md and the relevant `docs/` page before changing behavior — they document constraints that aren't visible from the code.

---

## Tech stack at a glance

- **Runtime:** TanStack Start (React 19 + SSR) on Vite + TypeScript 7 strict.
- **Routing:** TanStack Router, file-based (`src/routes/`).
- **State / data:** TanStack Query + TanStack Form + Zod.
- **DB:** PostgreSQL via Drizzle ORM (`drizzle/` for migrations).
- **Auth:** Better Auth + Clerk (dual mode). See [`docs/auth/flow-audit.md`](docs/auth/flow-audit.md).
- **AI:** Custom multi-provider client (OpenAI, Anthropic, Ollama, LM Studio, llama.cpp) + RAG via ChromaDB. See [`docs/ai/architecture.md`](docs/ai/architecture.md).
- **UI:** Tailwind v4 + shadcn/ui + Radix.
- **i18n:** i18next with EN + ES + DK.
- **Testing:** Vitest (unit) + Playwright (E2E).
- **Observability:** Sentry.

---

## Module architecture

All feature code lives under `src/modules/<name>/`. Each module is self-contained: `api/`, `components/`, `model/`, `ui/`, plus a `manifest.ts` that auto-registers the module into the sidebar.

Active modules: `ai`, `auth`, `contact-messages`, `core` (kernel), `dashboard`, `database-admin` (super_admin), `help`, `landing`, `settings`, `shared`, `updates`, `users`.

**Hard rule:** cross-module imports go through the module's `index.ts` barrel. No deep imports (`@/modules/auth/api/signIn` is forbidden — use `@/modules/auth`).

Full ownership and layering rules: [`docs/architecture/module-ownership-audit.md`](docs/architecture/module-ownership-audit.md) and [`docs/architecture/modular-architecture-plan.md`](docs/architecture/modular-architecture-plan.md).

---

## Commands you'll actually use

| Want to…                    | Run                                                                      |
| --------------------------- | ------------------------------------------------------------------------ |
| Boot dev (full)             | `pnpm dev` — db:up + migrate + admin seed + AI check + Vite              |
| Boot dev (fast)             | `pnpm dev:fast` — assumes DB is running                                  |
| Type-check                  | `pnpm type-check`                                                        |
| Lint / format               | `pnpm lint` · `pnpm format`                                              |
| Run all unit tests          | `pnpm test`                                                              |
| Run E2E (Playwright)        | `pnpm test:e2e`                                                          |
| Full pre-commit gate        | `pnpm validate` — type-check + lint + prettier + i18n check + unit tests |
| Generate / apply migrations | `pnpm db:generate` then `pnpm db:migrate`                                |
| Verify i18n parity          | `pnpm i18n:check`                                                        |
| Smoke-test AI stack         | `pnpm docker:ai:smoke`                                                   |

Husky + lint-staged runs prettier + i18n check on every commit. Don't bypass with `--no-verify` unless explicitly asked.

---

## AI / RAG scaffolding

- Switch providers: `pnpm ai:switch` (interactive).
- Ingest RAG corpus into ChromaDB: `pnpm rag:ingest`.
- Smoke real chat completion: `pnpm docker:ai:smoke:chat`.
- Provider configs live in `src/modules/ai/providers/`. Each has its own README.

---

## Source of truth before you "fix" something

- **Scripts:** `package.json` — not the README. Update both when you add one.
- **Modules:** `src/modules/<name>/manifest.ts` — not the README.
- **Routes:** regenerate inventory with `pnpm routes:inventory` (writes `docs/testing/routes-inventory.yaml`).
- **i18n keys:** `pnpm i18n:check` — fails CI if locales drift.
- **Env vars:** `.env.example` is the single source of truth for required variables.

---

## Conventions to respect

- **Conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, scoped where useful — `docs(readme):`, `feat(ai):`).
- **No business logic in routes** — routes are thin adapters; logic lives in modules.
- **All user-visible strings via `t('key')`** — no hardcoded UI text.
- **Env access via the typed config object** — never `process.env.X` directly in components.
- **Server functions** go in `module/server/` or `module/api/`, never mixed with UI.

---

## Things to ask the user before doing

- Adding a new AI provider or rewiring the provider registry.
- Changing the DB schema (it propagates to every derived app).
- Modifying the `AppModuleManifest` type (breaking change for every module).
- Switching or disabling the auth provider.
- Touching `tools/create-edd-app/` — that's the npm package, releases go through `pnpm release`.

---

## What's currently in flight

- Authorization hardening — see [`docs/architecture/authorization-hardening-plan.md`](docs/architecture/authorization-hardening-plan.md).
- Multi-tenancy / Postgres RLS design notes — see [`docs/architecture/multi-tenancy-and-rls-notes.md`](docs/architecture/multi-tenancy-and-rls-notes.md). Not yet implemented.
- Strategic roadmap — [`docs/planning/strategic-plan.md`](docs/planning/strategic-plan.md).

If you're unsure whether a change belongs in the template or in a consuming app, default to the consuming app and ask.
