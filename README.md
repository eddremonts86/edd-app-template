# edd-app-template

> Production-ready SaaS starter built on TanStack Start. Clone it, add your domain module, and ship in under 30 minutes.

![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.x-ff4154?logo=react-query&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What's inside

A battle-tested, opinionated monolith with every cross-cutting concern already wired up:

| Layer | Choice |
|---|---|
| Framework | TanStack Start (SSR) + TanStack Router (file-based) |
| Language | TypeScript 7 — strict mode |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Database | PostgreSQL · Drizzle ORM · drizzle-kit migrations |
| Auth | Better Auth — email/password, sessions, protected routes |
| AI | Multi-provider (OpenAI, Anthropic, Ollama) + RAG (ChromaDB) |
| Forms | TanStack Form + Zod validation |
| Data fetching | TanStack Query with infinite scroll & optimistic updates |
| Testing | Vitest (unit) + Playwright (E2E) |
| i18n | i18next — EN + ES out of the box |
| Infra | Docker Compose (Postgres + ChromaDB) · Netlify-ready |

---

## Modules

```
src/modules/
├── ai/          # Multi-provider AI client, RAG pipeline, streaming chat
├── auth/        # Sign-up, sign-in, sign-out, session guards
├── core/        # App shell, error boundaries, global state
├── dashboard/   # Authenticated layout, sidebar, user menu, widgets
├── help/        # Quick-links widget, help page
├── landing/     # Public marketing layout (Hero → Features → Pricing → CTA)
├── settings/    # Profile, password change, account deletion
└── users/       # User management table with infinite scroll & CRUD
```

Each module is self-contained: `api/`, `components/`, `model/`, `ui/`, and a `manifest.ts` that registers itself into the sidebar automatically.

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop (for local Postgres + ChromaDB)

### 1. Clone & install

```bash
git clone https://github.com/eddremonts86/edd-app-template.git my-app
cd my-app
pnpm install
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
pnpm dev         # http://localhost:3000
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
| Command | Description |
|---|---|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm dev:all` | Start DB + dev server in one command |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build locally |

### Database
| Command | Description |
|---|---|
| `pnpm db:up` | Start Postgres + ChromaDB containers |
| `pnpm db:down` | Stop and remove containers |
| `pnpm db:generate` | Generate SQL migration files |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:seed` | Load sample data |

### Testing
| Command | Description |
|---|---|
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run Playwright E2E suite |
| `pnpm test:e2e:ui` | Open Playwright UI mode |
| `pnpm type-check` | TypeScript strict check — zero errors |

### Code quality
| Command | Description |
|---|---|
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier |

### AI & Docker
| Command | Description |
|---|---|
| `pnpm ai:switch` | Switch AI provider interactively |
| `pnpm docker:up` | Full stack (app + AI services) |
| `pnpm docker:verify` | Verify all services are healthy |
| `pnpm docker:reset` | Soft reset the Docker stack |

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

- [Architecture](docs/architecture/modular-architecture-plan.md)
- [AI system](docs/ai/architecture.md)
- [Auth flows](docs/auth/flow-audit.md)
- [Testing guide](docs/testing/local-auth-bypass.md)
- [Strategic roadmap](docs/planning/strategic-plan.md)

---

## License

MIT
