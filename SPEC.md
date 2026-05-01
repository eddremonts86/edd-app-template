# SPEC.md — edd-app-template

**Version:** 1.0.0  
**Date:** 2026-04-29  
**Status:** Approved  

---

## 1. Objective

`edd-app-template` is a production-ready, opinionated starter for **any SaaS or landing-page app** in this workspace.  
It is the distilled, business-domain-agnostic core extracted from `apps/budget-app` (formerly `tanstack-template`).

**Target users:** Edd and any developer in this workspace spinning up a new app from the 96+ planned projects in `docs/projects/ia-generated/`.

**Goal:** Clone this template, rename the package, add a domain-specific module, and have a fully working SaaS running in under 30 minutes.

**AI Default:** MiniMax is integrated as the default LLM agent. See .env.example for configuration.

---

## 2. Core Features & Acceptance Criteria

### 2.1 Authentication
- Better Auth with email/password sign-up, sign-in, sign-out  
- Session management (JWT/cookie)  
- Protected routes (redirect unauthenticated to `/auth/sign-in`)  
- Acceptance: E2E tests for sign-up, sign-in, sign-out pass

### 2.2 Landing Page
- Public marketing layout (`_landing` route group)  
- Sections: Hero → Features → Pricing → CTA → Footer  
- Responsive, Tailwind v4, dark/light mode  
- Acceptance: Visually renders all sections; no console errors

### 2.3 Dashboard Shell
- Authenticated app layout (`_dashboard` route group)  
- Sidebar navigation driven by module manifests  
- Header with user avatar + profile dropdown  
- Widget-based home screen (empty state by default)  
- Acceptance: Auth guard works; navigation renders registered module items

### 2.4 User & Settings
- Profile page (name, email, avatar)  
- Account settings (password change, delete account)  
- Acceptance: Profile updates persist to DB

### 2.5 AI Integration
- Multi-provider AI client (OpenAI, Anthropic, Ollama) configurable via `.env`  
- Provider switcher script (`pnpm ai:switch`)  
- RAG ingestion pipeline (ChromaDB)  
- AI search command (`Cmd+K` style)  
- Acceptance: Chat completion returns response from configured provider

### 2.6 Database
- PostgreSQL via Drizzle ORM  
- Schema: `users`, `sessions`, `accounts` (Better Auth tables)  
- Docker Compose for local DB + ChromaDB  
- Migrations managed with `drizzle-kit`  
- Acceptance: `pnpm db:migrate` runs clean on empty DB

### 2.7 Module Registry
- `src/modules/core` manifest system  
- Modules self-register via `registry.ts`  
- Navigation items injected from manifests  
- Acceptance: Adding a new module manifest auto-appears in sidebar

### 2.8 Help System
- In-app help panel / FAQ  
- Acceptance: Opens without errors; placeholder content

### 2.9 i18n
- i18next with EN + ES locales  
- Locale switcher in settings  
- Acceptance: Switching locale updates all translated strings

---

## 3. Tech Stack (Fixed)

| Layer | Technology |
|-------|-----------|
| Runtime | TanStack Start (React 18 + SSR) |
| Routing | TanStack Router (file-based) |
| Server state | TanStack Query |
| Bundler | Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Better Auth |
| AI | Vercel AI SDK (multi-provider) |
| Vector DB | ChromaDB |
| Testing | Vitest (unit) + Playwright (E2E) |
| Package manager | pnpm |
| Containerization | Docker Compose |
| Deployment | Netlify (netlify.toml) |

---

## 4. Project Structure

```
apps/edd-app-template/
├── SPEC.md                    # This file
├── agent.md                   # Architecture guide for AI agents
├── package.json               # name: "edd-app-template"
├── vite.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── components.json            # shadcn/ui config
├── eslint.config.js
├── .prettierrc
├── .env.example               # All required env vars with placeholders
├── netlify.toml
├── docker-compose.yml         # DB + ChromaDB
├── Dockerfile
│
├── drizzle/                   # Auth-only migrations
│
├── scripts/
│   ├── ai/                    # switch-provider, test-integration, ingest-rag
│   ├── db/                    # seed-db (minimal auth seed)
│   ├── dev/                   # check-models
│   ├── docker/                # migrate-llm-storage
│   └── testing/               # e2e-ci-local, prepare-auth-e2e-db
│
├── public/
│
├── src/
│   ├── client.tsx
│   ├── ssr.tsx
│   ├── start.ts
│   ├── router.tsx
│   │
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── _root-components.tsx
│   │   ├── _root-components/
│   │   ├── _landing/          # index.tsx, route.tsx
│   │   ├── _dashboard/        # route.tsx, dashboard/
│   │   ├── auth/              # route.tsx, sign-in.tsx, sign-up.tsx
│   │   ├── api/
│   │   │   └── auth/          # Better Auth catch-all
│   │   └── routeTree.gen.ts
│   │
│   ├── modules/
│   │   ├── README.md          # Module architecture guide
│   │   ├── index.ts           # Module barrel
│   │   ├── core/              # Registry, types, navigation runtime
│   │   ├── auth/              # Auth flows + Better Auth client
│   │   ├── landing/           # Hero, Features, Pricing, CTA, Footer
│   │   ├── dashboard/         # Dashboard shell + widget system
│   │   ├── users/             # User model + profile API
│   │   ├── settings/          # Settings UI + account management
│   │   ├── ai/                # Multi-provider AI + RAG + search
│   │   └── help/              # Help panel
│   │
│   └── shared/
│       ├── hooks/
│       ├── layouts/
│       ├── lib/
│       │   ├── db/            # Drizzle client + schema (auth tables only)
│       │   └── auth/          # Better Auth server config
│       ├── providers/
│       ├── styles/
│       ├── types/
│       ├── ui/                # Primitive UI components
│       └── utils/
│
└── tests/
    ├── setup.ts
    ├── unit/
    │   └── modules/
    │       ├── auth/
    │       └── core/
    └── e2e/
        ├── auth.signup.local.spec.ts
        ├── auth.signin.local.spec.ts
        └── auth.logout.local.spec.ts
```

---

## 5. Code Style

Inherits all rules from the workspace root `eslint.config.mjs` plus:

- **Module boundaries**: modules import from each other only through `index.ts` barrels
- **No cross-module deep imports**: `@/modules/auth/api/signIn` is forbidden; use `@/modules/auth`
- **Server functions**: live in `module/server/` or `module/api/`; never mixed with UI
- **No business logic in routes**: routes are thin adapters — all logic lives in modules
- **Types**: all public module APIs typed; no `any`
- **i18n**: all user-visible strings use `t('key')` — no hardcoded UI strings
- **Env vars**: always accessed via a typed config object, never `process.env.X` directly in components

---

## 6. Testing Strategy

### Unit (Vitest)
- Module manifest shape validation
- Auth utility functions
- Core registry logic
- i18n key completeness

### E2E (Playwright)
- `auth.signup.local.spec.ts` — full sign-up flow
- `auth.signin.local.spec.ts` — sign-in with valid + invalid credentials
- `auth.logout.local.spec.ts` — sign-out clears session
- `landing.spec.ts` — landing page sections render
- `dashboard.spec.ts` — protected route redirects + dashboard loads after login

### Smoke
- `pnpm test:seeded:smoke` — confirms app responds after DB seed

---

## 7. Boundaries

### Always do
- Keep modules self-contained with a manifest
- Use the module registry for navigation
- Source all secrets from `.env` via typed config
- Run `pnpm type-check` and `pnpm lint` before committing

### Ask first
- Adding a new AI provider
- Changing the DB schema (affects all apps derived from this template)
- Modifying the module manifest type (breaking change for all registered modules)
- Changing the auth provider

### Never do
- Hardcode API keys, tokens, or connection strings
- Add business-domain logic (budgets, tasks, orders, etc.) — that belongs in the consuming app
- Set `Access-Control-Allow-Origin: *` in production
- Use `any` in public module APIs
- Deep-import from another module (bypass the barrel)
- Ship with placeholder/mock data enabled in production builds

---

## 8. Module Classification (what stays in budget-app vs this template)

| Module | Template | Budget-app only |
|--------|----------|-----------------|
| `auth` | ✅ | |
| `ai` | ✅ | |
| `core` | ✅ | |
| `landing` | ✅ | |
| `dashboard` | ✅ | |
| `users` | ✅ | |
| `settings` | ✅ | |
| `help` | ✅ | |
| `shared` | ✅ | |
| `budgets` | | ✅ |
| `categories` | | ✅ |
| `transactions` | | ✅ |
| `projects` | | ✅ |
| `tasks` | | ✅ |
| `team` | | ✅ |
| `analytics` | | ✅ |

---

## 9. How to Use This Template for a New App

```bash
# 1. Copy template
cp -r apps/edd-app-template apps/my-new-app

# 2. Update package name
# Edit apps/my-new-app/package.json → "name": "my-new-app"

# 3. Configure environment
cp apps/my-new-app/.env.example apps/my-new-app/.env.development
# Fill in DB_URL, AUTH_SECRET, AI keys

# 4. Start DB and run migrations
cd apps/my-new-app && pnpm db:up && pnpm db:migrate

# 5. Create your domain module
# Add apps/my-new-app/src/modules/my-feature/manifest.ts
# Register it in src/modules/index.ts

# 6. Start dev server
pnpm dev
```
