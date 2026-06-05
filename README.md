# edd-app-template

> Production-ready SaaS starter built on TanStack Start. Bootstrap it with npx, add your domain module, and ship in under 30 minutes.

![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.x-ff4154?logo=react-query&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What's inside

A battle-tested, opinionated monolith with every cross-cutting concern already wired up:

| Layer         | Choice                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Framework     | TanStack Start (SSR) + TanStack Router (file-based)                    |
| Language      | TypeScript 7 — strict mode                                             |
| Styling       | Tailwind CSS v4 + shadcn/ui + Radix UI                                 |
| Database      | PostgreSQL · Drizzle ORM · drizzle-kit migrations                      |
| Auth          | Better Auth + Clerk — email/password, sessions, RBAC, protected routes |
| AI            | Multi-provider (OpenAI, Anthropic, Ollama) + RAG (ChromaDB)            |
| Forms         | TanStack Form + Zod validation                                         |
| Data fetching | TanStack Query with infinite scroll & optimistic updates               |
| Testing       | Vitest (unit) + Playwright (E2E)                                       |
| i18n          | i18next — EN + ES + DK out of the box                                  |
| Infra         | Docker Compose (Postgres + ChromaDB) · Netlify-ready                   |
| Observability | Sentry — error tracking and performance monitoring                     |

---

## Modules

```
src/modules/
├── ai/                # Multi-provider AI client, RAG pipeline, streaming chat
├── auth/              # Sign-in / sign-up / password recovery (Better Auth + Clerk)
├── contact-messages/  # Landing contact form inbox + dashboard widget (admin+)
├── core/              # Module registry, manifest types, navigation, widgets — required kernel
├── dashboard/         # Authenticated app shell, sidebar, default dashboard page
├── database-admin/    # DB connection profiles, migration runner, audit trail (super_admin)
├── help/              # Quick-links widget, help page
├── landing/           # Public marketing page (hero, features, services, contact, footer)
├── settings/          # Theme, language, AI config, dev tools, system settings
├── shared/            # Business code reused by ≥ 2 modules (placeholder today)
├── updates/           # Starter "subscribe to updates" block (disabled by default)
└── users/             # User directory, role helpers, RBAC (admin+)
```

Each module is self-contained: `api/`, `components/`, `model/`, `ui/`, and a `manifest.ts` that registers itself into the sidebar automatically.

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop (for local Postgres + ChromaDB)

### 1. Bootstrap with npx

```bash
npx @edd_remonts/create-edd-app my-app
cd my-app
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, BETTER_AUTH_SECRET, and your AI provider key
```

### 3. Start the database

```bash
pnpm db:up       # starts Postgres + ChromaDB containers
pnpm db:push     # pushes Drizzle schema to the DB
pnpm db:seed     # optional: loads sample data
```

### 4. Run the dev server

```bash
pnpm dev         # full bootstrap: db:up + db:migrate + db:seed:admin + AI model check + Vite on :3000
pnpm dev:fast    # skip DB setup — fastest startup (DB assumed already running)
pnpm dev:e2e     # dev server with VITE_E2E=true for Playwright runs
```

### Alternative: clone manually

```bash
git clone https://github.com/eddremonts86/edd-app-template.git my-app
cd my-app
pnpm install
```

---

## Using this as a template

1. Change `name` in `package.json`
2. Update `VITE_APP_NAME` in `.env`
3. Add your domain module under `src/modules/<your-module>/`
4. Register it in `src/modules/index.ts` and add a `manifest.ts`
5. Run `pnpm db:generate && pnpm db:migrate` for any new schema

That's it. Auth, layout, navigation, AI, and testing infrastructure are already done.

---

## AI system

The template ships with a pluggable multi-provider AI layer:

```bash
pnpm ai:switch          # interactive provider switcher (OpenAI / Anthropic / Ollama)
pnpm rag:ingest         # ingest documents into ChromaDB for RAG
pnpm docker:ai:smoke    # smoke-test the AI stack
```

Supported providers out of the box: **OpenAI**, **Anthropic Claude**, **Ollama** (local), **LM Studio**, **llama.cpp**.

---

## Scripts reference

### Dev

| Command         | Description                                           |
| --------------- | ----------------------------------------------------- |
| `pnpm dev`      | Full bootstrap (DB + migrations + admin seed) → Vite  |
| `pnpm dev:fast` | Skip DB setup, just Vite (DB must already be running) |
| `pnpm dev:e2e`  | Dev server with `VITE_E2E=true` for Playwright        |
| `pnpm build`    | Production build                                      |
| `pnpm preview`  | Preview production build locally                      |

### Database

| Command                  | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `pnpm db:up`             | Start Postgres container (if not already running)          |
| `pnpm db:down`           | Stop and remove containers                                 |
| `pnpm db:generate`       | Generate SQL migration files from Drizzle schema           |
| `pnpm db:migrate`        | Create DB (if needed) and run pending migrations           |
| `pnpm db:push`           | Push schema directly (dev only — bypasses migration files) |
| `pnpm db:seed`           | Load sample data                                           |
| `pnpm db:seed:admin`     | Seed the super-admin user                                  |
| `pnpm db:seed:rbac`      | Seed RBAC roles and permissions                            |
| `pnpm db:seed:realistic` | Generate + import a realistic dataset                      |
| `pnpm db:seed:complex`   | Alias for `db:seed:realistic`                              |
| `pnpm db:seed:tx232`     | Seed 232 random transactions (perf testing)                |
| `pnpm db:seed:all`       | Run realistic + tx232 seeds end-to-end                     |

### Testing

| Command                           | Description                              |
| --------------------------------- | ---------------------------------------- |
| `pnpm test`                       | Run unit tests (Vitest)                  |
| `pnpm test:unit`                  | Alias for `pnpm test`                    |
| `pnpm test:e2e`                   | Run full Playwright E2E suite            |
| `pnpm test:e2e:auth-local`        | Playwright with local auth bypass config |
| `pnpm test:e2e:auth-local:signup` | Local-auth signup spec                   |
| `pnpm test:e2e:auth-local:logout` | Local-auth logout spec                   |
| `pnpm test:e2e:ci-local`          | CI-equivalent local E2E run              |
| `pnpm test:e2e:ui`                | Open Playwright UI mode                  |
| `pnpm test:seeded:smoke`          | Smoke test against a seeded DB           |
| `pnpm test:ai-integration`        | AI provider integration test             |
| `pnpm test:visual`                | Percy visual regression                  |
| `pnpm type-check`                 | TypeScript strict check — zero errors    |

### Code quality

| Command             | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `pnpm lint`         | ESLint                                                                  |
| `pnpm lint:fix`     | ESLint with auto-fix                                                    |
| `pnpm format`       | Prettier write                                                          |
| `pnpm format:check` | Prettier check (no writes)                                              |
| `pnpm doctor`       | `react-doctor` analysis                                                 |
| `pnpm validate`     | Full pre-commit gate: type-check + lint + prettier + i18n check + tests |

### AI & Docker

| Command                     | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `pnpm ai:switch`            | Interactive AI provider switcher                                |
| `pnpm setup:rag`            | Bring up DB + wait + ingest RAG                                 |
| `pnpm rag:ingest`           | Ingest documents into ChromaDB                                  |
| `pnpm docker:up`            | Full Docker stack (app + AI services) — foreground              |
| `pnpm docker:up:detached`   | Same as `docker:up` but detached                                |
| `pnpm docker:up:full`       | Boot every AI runtime (llama.cpp + Ollama + LM Studio + Chroma) |
| `pnpm docker:down`          | Stop the Docker stack                                           |
| `pnpm docker:logs`          | Tail Docker logs                                                |
| `pnpm docker:check`         | Verify stack health                                             |
| `pnpm docker:reset`         | Soft reset the Docker stack                                     |
| `pnpm docker:reset:hard`    | Hard reset (removes volumes)                                    |
| `pnpm docker:ai:smoke`      | Smoke-test the AI stack                                         |
| `pnpm docker:ai:smoke:chat` | Smoke-test a real chat completion                               |
| `pnpm docker:verify`        | Full healthcheck (`docker:check` + both AI smokes)              |

### Routes & i18n

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `pnpm routes:inventory` | Regenerate `docs/testing/routes-inventory.yaml`     |
| `pnpm i18n:check`       | Verify all 3 locales have matching translation keys |

### Release

| Command        | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `pnpm release` | Publish a new `@edd_remonts/create-edd-app` version to npm |

---

## Project structure

```
apps/edd-app-template/
├── src/
│   ├── modules/        # Feature modules (see above)
│   ├── routes/         # TanStack Router file-based routes
│   ├── shared/         # Shared UI components, hooks, utils
│   └── components/     # Global layout components
├── scripts/
│   ├── ai/             # AI provider bootstrap & RAG ingestion
│   ├── db/             # Seed scripts
│   └── testing/        # E2E helpers
├── drizzle/            # SQL migration files
├── tests/
│   ├── e2e/            # Playwright specs
│   ├── integration/    # API-level integration tests
│   └── unit/           # Vitest unit tests
├── docs/               # Architecture, AI, auth, and testing docs
├── .env.example        # All required env vars documented
├── docker-compose.yml  # Postgres + ChromaDB
└── vite.config.ts
```

---

## Docs

- [Documentation index](docs/README.md) — full inventory of internal docs
- [Architecture overview](docs/architecture/modular-architecture-plan.md) — modules, routes, layering
- [Module ownership rules](docs/architecture/module-ownership-audit.md)
- [CRUD sheet protocol](docs/architecture/crud-sheet-protocol.md)
- [Authorization hardening](docs/architecture/authorization-hardening-plan.md)
- [Multi-tenancy & RLS notes](docs/architecture/multi-tenancy-and-rls-notes.md)
- [AI system](docs/ai/architecture.md) — providers, RAG, language detection
- [Auth flows](docs/auth/flow-audit.md) — Better Auth + Clerk dual mode
- [Testing guide](docs/testing/local-auth-bypass.md)
- [Strategic roadmap](docs/planning/strategic-plan.md)
- [Design system](DESIGN.md) — colors, typography, components
- [Product context](PRODUCT.md) — personas, tone, anti-references
- [Spec](SPEC.md) — acceptance criteria per module
- [Claude Code orientation](CLAUDE.md) — entry point for AI agents

---

## Releasing the create-edd-app CLI

The `@edd_remonts/create-edd-app` npm package lives in `tools/create-edd-app/`.
A single command handles the full release flow:

```bash
pnpm release
```

Bumps the version, commits, tags, pushes, and triggers CI to publish to npm.
See [`tools/create-edd-app/README.md`](tools/create-edd-app/README.md) for full details.

---

## License

MIT
