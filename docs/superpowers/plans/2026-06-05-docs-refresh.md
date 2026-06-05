# Documentation Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the root-level documentation (`README.md`, `SPEC.md`, `docs/README.md`) in line with the actual code state, add a `CLAUDE.md` to orient AI agents, and remove/relocate stale files at the repo root.

**Architecture:** Pure documentation work — no runtime code touched. Each edit verifies against a source of truth (`package.json`, `src/modules/`, `git log`, `.github/agents/`). One logical commit per concern, conventional-commit style matching the project's existing history.

**Tech Stack:** Markdown only. Shell verifications via `grep`, `ls`, `git`. The repo uses `pnpm`, conventional commits (`feat:`/`fix:`/`chore:`/`docs:`), Husky+lint-staged on commit (which runs prettier on `.md`).

---

## File Structure

**Create:**

- `CLAUDE.md` — AI-agent orientation file (project overview, stack, conventions, commands)
- `docs/architecture/multi-tenancy-and-rls-notes.md` — converted from `dbUpdates.txt`

**Modify:**

- `README.md` — fix module list, i18n, stack table, dev command, scripts reference, docs links
- `SPEC.md` — React 18→19, AI SDK reference, add Updated date
- `docs/README.md` — add missing references
- `.gitignore` — add `env.zip`

**Delete:**

- `Por favor lee y entiendo el documento, c.ts` (0-byte accident)
- `agent.md` (15KB, obsolete, references old project name "tanstack-template" and non-existent `projects` module)
- `dbUpdates.txt` (content migrated to docs/architecture/)
- `env.zip` (untrack from git; physical file kept on disk locally — user decides on full deletion later)

---

## Task 1: Pre-flight check

**Files:** none (read-only)

- [ ] **Step 1.1: Confirm clean working tree before starting**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git status
```

Expected: `nothing to commit, working tree clean` (or only the new plan file in `docs/superpowers/plans/` shown as untracked). If there are unrelated changes, STOP and check with the user before proceeding.

- [ ] **Step 1.2: Note current branch**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git branch --show-current
```

Record the branch name — all commits in this plan go there. No new branch is created (small docs-only work).

- [ ] **Step 1.3: Commit the plan itself first**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git add docs/superpowers/plans/2026-06-05-docs-refresh.md && git commit -m "docs: add documentation-refresh plan"
```

Expected: `1 file changed, ... insertions(+)`.

---

## Task 2: Delete the broken-name accident file

**Files:**

- Delete: `Por favor lee y entiendo el documento, c.ts`

- [ ] **Step 2.1: Confirm the file is empty (sanity)**

Run:

```bash
wc -c "/Volumes/Works/github/iaWorkSpace/apps/edd-app-template/Por favor lee y entiendo el documento, c.ts"
```

Expected: `0 /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/Por favor lee y entiendo el documento, c.ts`. If non-zero, STOP and show contents to user.

- [ ] **Step 2.2: Delete via git**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git rm "Por favor lee y entiendo el documento, c.ts"
```

Expected: `rm 'Por favor lee y entiendo el documento, c.ts'`.

(Commit deferred — bundled with Task 3 in a single junk-removal commit at end of Task 4.)

---

## Task 3: Delete the obsolete `agent.md`

**Files:**

- Delete: `agent.md`

- [ ] **Step 3.1: Confirm staleness (read top of file)**

Run:

```bash
head -20 /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/agent.md
```

Expected: lines mentioning "tanstack-template" (old project name), "React 18", `/Volumes/Works/github/tanstack-template/` paths, `projects` module. These are all obsolete — confirms safe deletion.

- [ ] **Step 3.2: Delete via git**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git rm agent.md
```

Expected: `rm 'agent.md'`.

---

## Task 4: Untrack `env.zip` and update `.gitignore`

**Files:**

- Modify: `.gitignore`
- Untrack (keep on disk): `env.zip`

- [ ] **Step 4.1: Verify env.zip is currently tracked**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git ls-files --error-unmatch env.zip
```

Expected: `env.zip` printed (confirms tracked).

- [ ] **Step 4.2: Add `env.zip` to `.gitignore`**

Read current `.gitignore`. Append the following block at the end:

```
# Local env bundles — never commit
env.zip
*.env.zip
```

- [ ] **Step 4.3: Untrack the file (keep local copy)**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git rm --cached env.zip
```

Expected: `rm 'env.zip'`. The physical file remains on disk.

- [ ] **Step 4.4: Commit the junk cleanup (Tasks 2+3+4)**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git status -s
```

Expected output includes:

```
D  Por favor lee y entiendo el documento, c.ts
D  agent.md
D  env.zip
M  .gitignore
```

Then commit:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git commit -m "chore: remove stale root-level files and untrack env.zip

- Delete 'Por favor lee y entiendo el documento, c.ts' (0-byte accident).
- Delete agent.md (obsolete; referenced old project name and non-existent modules).
- Untrack env.zip and add it to .gitignore."
```

Expected: `4 files changed, ... deletions(-)`.

> **Note for user follow-up (out of plan scope):** `env.zip` will remain in git history. If it contains real secrets, run `git log --all -- env.zip` and consider full history rewrite (BFG / git filter-repo) — that is a separate concern, not part of this plan.

---

## Task 5: Migrate `dbUpdates.txt` → `docs/architecture/multi-tenancy-and-rls-notes.md`

**Files:**

- Create: `docs/architecture/multi-tenancy-and-rls-notes.md`
- Delete: `dbUpdates.txt`

- [ ] **Step 5.1: Read full `dbUpdates.txt` to capture all content**

Run:

```bash
wc -l /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/dbUpdates.txt
```

Note the line count, then read the entire file. The first 3 lines are an editor-only prompt (in Spanish) that must be stripped. Everything after is technical content to keep verbatim.

- [ ] **Step 5.2: Create the new markdown file**

Write `docs/architecture/multi-tenancy-and-rls-notes.md` with this structure:

```markdown
# Multi-tenancy and Row-Level Security — design notes

> **Status:** Reference notes — not yet implemented in this template. Captures principles to apply when adding multi-tenant data, RBAC, and PostgreSQL Row-Level Security to a derived app.
>
> **Source:** Working notes migrated from `dbUpdates.txt` (Jun 2026).

[... entire technical content of dbUpdates.txt from line 8 onwards, verbatim ...]
```

Replace the bracketed line with the actual content from `dbUpdates.txt` starting at line 8 (skipping the 3 prompt lines + blank lines).

- [ ] **Step 5.3: Verify the new file**

Run:

```bash
head -3 /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/docs/architecture/multi-tenancy-and-rls-notes.md
wc -l /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/docs/architecture/multi-tenancy-and-rls-notes.md
```

Expected: first line is `# Multi-tenancy and Row-Level Security — design notes`. Line count is approximately `original_lines - 7` (dropped prompt + blank lines).

- [ ] **Step 5.4: Delete the original `.txt`**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git rm dbUpdates.txt && git add docs/architecture/multi-tenancy-and-rls-notes.md
```

- [ ] **Step 5.5: Commit**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git commit -m "docs(architecture): migrate dbUpdates.txt → multi-tenancy-and-rls-notes.md"
```

Expected: `2 files changed`.

---

## Task 6: Update `README.md`

**Files:**

- Modify: `README.md`

Apply edits in this order. After each edit, the next step reads the file to confirm before moving on.

- [ ] **Step 6.1: Replace the stack table (add Sentry, mention Clerk)**

In `README.md`, find this row:

```
| Auth          | Better Auth — email/password, sessions, protected routes    |
```

Replace with:

```
| Auth          | Better Auth + Clerk — email/password, sessions, RBAC, protected routes |
```

Then after the `| Infra ... |` row, insert this new row before the closing of the table:

```
| Observability | Sentry — error tracking and performance monitoring          |
```

Also update the `i18n` row from:

```
| i18n          | i18next — EN + ES out of the box                            |
```

to:

```
| i18n          | i18next — EN + ES + DK out of the box                       |
```

- [ ] **Step 6.2: Replace the Modules code-fence**

Find this block:

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

Replace with:

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

- [ ] **Step 6.3: Update the dev-server section to reflect actual `pnpm dev` behavior**

Find:

````
### 4. Run the dev server

```bash
pnpm dev         # http://localhost:3000
```
````

Replace with:

````
### 4. Run the dev server

```bash
pnpm dev         # full bootstrap: db:up + db:migrate + db:seed:admin + AI model check + Vite on :3000
pnpm dev:fast    # skip DB setup — fastest startup (DB assumed already running)
pnpm dev:e2e     # dev server with VITE_E2E=true for Playwright runs
```
````

- [ ] **Step 6.4: Replace the entire Scripts reference section**

Find the section that starts with `## Scripts reference` and ends just before `## Project structure`. Replace the whole block with:

```
## Scripts reference

### Dev

| Command         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `pnpm dev`      | Full bootstrap (DB + migrations + admin seed) → Vite     |
| `pnpm dev:fast` | Skip DB setup, just Vite (DB must already be running)    |
| `pnpm dev:e2e`  | Dev server with `VITE_E2E=true` for Playwright           |
| `pnpm build`    | Production build                                         |
| `pnpm preview`  | Preview production build locally                         |

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

| Command                          | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| `pnpm test`                      | Run unit tests (Vitest)                                   |
| `pnpm test:unit`                 | Alias for `pnpm test`                                     |
| `pnpm test:e2e`                  | Run full Playwright E2E suite                             |
| `pnpm test:e2e:auth-local`       | Playwright with local auth bypass config                  |
| `pnpm test:e2e:auth-local:signup`| Local-auth signup spec                                    |
| `pnpm test:e2e:auth-local:logout`| Local-auth logout spec                                    |
| `pnpm test:e2e:ci-local`         | CI-equivalent local E2E run                               |
| `pnpm test:e2e:ui`               | Open Playwright UI mode                                   |
| `pnpm test:seeded:smoke`         | Smoke test against a seeded DB                            |
| `pnpm test:ai-integration`       | AI provider integration test                              |
| `pnpm test:visual`               | Percy visual regression                                   |
| `pnpm type-check`                | TypeScript strict check — zero errors                     |

### Code quality

| Command            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `pnpm lint`        | ESLint                                                     |
| `pnpm lint:fix`    | ESLint with auto-fix                                       |
| `pnpm format`      | Prettier write                                             |
| `pnpm format:check`| Prettier check (no writes)                                 |
| `pnpm doctor`      | `react-doctor` analysis                                    |
| `pnpm validate`    | Full pre-commit gate: type-check + lint + prettier + i18n check + tests |

### AI & Docker

| Command                  | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `pnpm ai:switch`         | Interactive AI provider switcher                           |
| `pnpm setup:rag`         | Bring up DB + wait + ingest RAG                            |
| `pnpm rag:ingest`        | Ingest documents into ChromaDB                             |
| `pnpm docker:up`         | Full Docker stack (app + AI services) — foreground         |
| `pnpm docker:up:detached`| Same as `docker:up` but detached                           |
| `pnpm docker:up:full`    | Boot every AI runtime (llama.cpp + Ollama + LM Studio + Chroma) |
| `pnpm docker:down`       | Stop the Docker stack                                      |
| `pnpm docker:logs`       | Tail Docker logs                                           |
| `pnpm docker:check`      | Verify stack health                                        |
| `pnpm docker:reset`      | Soft reset the Docker stack                                |
| `pnpm docker:reset:hard` | Hard reset (removes volumes)                               |
| `pnpm docker:ai:smoke`   | Smoke-test the AI stack                                    |
| `pnpm docker:ai:smoke:chat` | Smoke-test a real chat completion                       |
| `pnpm docker:verify`     | Full healthcheck (`docker:check` + both AI smokes)         |

### Routes & i18n

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `pnpm routes:inventory`| Regenerate `docs/testing/routes-inventory.yaml`            |
| `pnpm i18n:check`      | Verify all 3 locales have matching translation keys        |

### Release

| Command        | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `pnpm release` | Publish a new `@edd_remonts/create-edd-app` version to npm |

```

- [ ] **Step 6.5: Replace the Docs links section**

Find the `## Docs` section. Replace with:

```
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
```

- [ ] **Step 6.6: Verify all updates**

Run:

```bash
grep -c "contact-messages\|database-admin\|^| Observability" /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/README.md
grep -c "EN + ES + DK" /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/README.md
grep -c "pnpm dev:fast\|pnpm validate\|pnpm i18n:check\|pnpm docker:verify" /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/README.md
```

Expected: each grep returns a positive integer (matches > 0).

- [ ] **Step 6.7: Commit**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git add README.md && git commit -m "docs(readme): sync with current modules, scripts, locales and stack"
```

---

## Task 7: Update `SPEC.md`

**Files:**

- Modify: `SPEC.md`

- [ ] **Step 7.1: Update the header block**

Find:

```
**Version:** 1.0.0
**Date:** 2026-04-29
**Status:** Approved
```

Replace with:

```
**Version:** 1.1.0
**Date:** 2026-04-29
**Updated:** 2026-06-05
**Status:** Approved
```

- [ ] **Step 7.2: Fix React version in tech stack table**

Find:

```
| Runtime          | TanStack Start (React 18 + SSR)        |
```

Replace with:

```
| Runtime          | TanStack Start (React 19 + SSR)        |
```

- [ ] **Step 7.3: Fix AI SDK reference in tech stack table**

Find:

```
| AI               | Vercel AI SDK (multi-provider)         |
```

Replace with:

```
| AI               | @tanstack/ai-* (multi-provider: OpenAI, Anthropic, Ollama, LM Studio, llama.cpp) |
```

- [ ] **Step 7.4: Verify edits**

Run:

```bash
grep -n "React 19\|@tanstack/ai-\|Updated:" /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/SPEC.md
```

Expected: three matches printed.

- [ ] **Step 7.5: Commit**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git add SPEC.md && git commit -m "docs(spec): bump to 1.1.0 — React 19, @tanstack/ai-* (was 18, Vercel AI SDK)"
```

---

## Task 8: Update `docs/README.md`

**Files:**

- Modify: `docs/README.md`

- [ ] **Step 8.1: Add the missing AI README reference**

Under the `## AI` section, after the line `- [Reorganization plan](ai/reorganization-plan.mdx) ...`, append a new bullet:

```
- [AI module overview](ai/README.mdx) — entry point to the AI module's docs
```

- [ ] **Step 8.2: Add the missing Architecture link**

Under the `## Architecture` section, after the `- [CRUD sheet protocol]...` line, append:

```
- [Authorization hardening plan](architecture/authorization-hardening-plan.md) — RBAC tightening and audit trail
- [Multi-tenancy and RLS notes](architecture/multi-tenancy-and-rls-notes.md) — design reference for tenant-scoped data
```

- [ ] **Step 8.3: Verify**

Run:

```bash
grep -c "ai/README.mdx\|authorization-hardening-plan\|multi-tenancy-and-rls-notes" /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/docs/README.md
```

Expected: `3`.

- [ ] **Step 8.4: Commit**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git add docs/README.md && git commit -m "docs(index): add missing references (ai/README.mdx, authorization-hardening, multi-tenancy notes)"
```

---

## Task 9: Create `CLAUDE.md`

**Files:**

- Create: `CLAUDE.md`

- [ ] **Step 9.1: Write the new file with this exact content**

Write `CLAUDE.md`:

```markdown
# CLAUDE.md

> Orientation file for Claude Code and other AI agents opening this repo. Read this first.

## What this is

`edd-app-template` is a production-ready, opinionated SaaS starter built on TanStack Start. It is the business-domain-agnostic distillation of `apps/budget-app`. Apps spun up from this template should be able to ship a working SaaS in under 30 minutes — auth, AI, DB, dashboard, i18n, RBAC are all wired.

The package is meant to be cloned via `npx @edd_remonts/create-edd-app <name>` (CLI lives in `tools/create-edd-app/`).

## Tech stack at a glance

- **Runtime:** TanStack Start (SSR) on React 19, Vite 8
- **Language:** TypeScript (strict)
- **Routing:** TanStack Router (file-based, `src/routes/`)
- **Data:** TanStack Query + TanStack DB
- **Styling:** Tailwind v4 + shadcn/ui (Radix) + `@base-ui/react`
- **DB:** PostgreSQL via Drizzle ORM (migrations in `drizzle/`)
- **Auth:** Better Auth + Clerk dual mode
- **AI:** `@tanstack/ai-*` (OpenAI, Anthropic, Ollama, LM Studio, llama.cpp) + ChromaDB RAG
- **Testing:** Vitest (unit) + Playwright (E2E, with auth-local bypass)
- **i18n:** i18next (EN, ES, DK)
- **Observability:** Sentry
- **Package manager:** pnpm (workspace at `pnpm-workspace.yaml` at repo root)

## Module architecture

13 modules under `src/modules/<name>/`. Each owns: `manifest.ts`, `ui/`, `model/`, `api/`, `server/`, `config/`, `index.ts`. See `src/modules/README.md` for the full module index, dependency graph, and copy-to-another-project instructions.

**Hard rules:**

- Cross-module imports only via the module barrel (`@/modules/auth`, **not** `@/modules/auth/api/signIn`)
- Routes in `src/routes/` are thin adapters — all logic lives in modules
- All user-visible strings go through `useTranslation()` — never hardcode UI text
- No `any` in public module APIs
- Env vars accessed via typed config, never `process.env.X` directly in components
- Modules self-register via `manifest.ts` → `core/registry.ts`. New modules appear in the sidebar automatically.

## Commands you'll reach for first

| Command                    | What it does                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                 | Full bootstrap: DB up, migrate, seed admin, check AI models, Vite  |
| `pnpm dev:fast`            | Skip DB setup, just start Vite                                     |
| `pnpm validate`            | Full pre-commit gate (type-check + lint + prettier + i18n + tests) |
| `pnpm type-check`          | TS strict — zero errors required                                   |
| `pnpm test:e2e:auth-local` | Playwright E2E with auth bypass                                    |
| `pnpm i18n:check`          | Confirm all 3 locales have matching keys                           |
| `pnpm routes:inventory`    | Regenerate `docs/testing/routes-inventory.yaml`                    |
| `pnpm docker:verify`       | Full healthcheck (DB + AI + ChromaDB)                              |

Full script reference in `README.md`. Operational scripts: `scripts/README.md`.

## AI scaffolding present in this repo

This project has extensive AI tooling already in place. Before adding new AI orchestration, check what exists:

- `.agents/skills/` — project-local skills
- `.github/agents/*.agent.md` — 20+ specialized agents (component-generator, db-schema, auth-flow, owasp-reviewer, i18n-sync, playwright, react-doctor, …)
- `.github/skills/`, `.github/instructions/` — Copilot/agent configuration
- `.impeccable/critique/` — code-critique output
- `.tsupgrader/KB/` — TypeScript upgrade knowledge base
- `scripts/ai/` — provider switching, RAG ingestion, integration tests

## Source of truth for decisions

- **What features must exist** → `SPEC.md` (acceptance criteria per module)
- **How it should look/feel** → `DESIGN.md` (colors, typography, motion, components) + `PRODUCT.md` (personas, tone, anti-references)
- **Module internals** → `src/modules/<module>/README.md`
- **Doc index** → `docs/README.md`

## Conventions when editing

- **Module boundaries:** never deep-import from another module
- **Unit tests:** Vitest specs next to code (`*.test.ts`); E2E in `tests/e2e/`
- **Migrations:** never edit applied migrations — create new ones with `pnpm db:generate`
- **Husky:** lint-staged runs ESLint + Prettier on commit; don't bypass with `--no-verify`
- **Commits:** conventional-commits style (`feat:`, `fix:`, `chore:`, `docs:`, …) — check `git log --oneline -20` for examples

## Things to ask before doing

- Adding a new AI provider
- Changing the DB schema (affects every app derived from this template)
- Modifying the module manifest type (breaking change for every registered module)
- Switching auth provider
- Adding business-domain logic (it belongs in the consuming app, not in this template)

## What's in flight

Check `docs/planning/strategic-plan.md` and the docs under `docs/architecture/` for current major initiatives (authorization hardening, multi-tenancy notes, module ownership audit, …).
```

- [ ] **Step 9.2: Verify**

Run:

```bash
head -3 /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/CLAUDE.md
wc -l /Volumes/Works/github/iaWorkSpace/apps/edd-app-template/CLAUDE.md
```

Expected: first line `# CLAUDE.md`; ~90–110 lines total.

- [ ] **Step 9.3: Commit**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git add CLAUDE.md && git commit -m "docs: add CLAUDE.md for AI-agent orientation"
```

---

## Task 10: Final verification

**Files:** none (read-only)

- [ ] **Step 10.1: Confirm no stragglers in working tree**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git status
```

Expected: `nothing to commit, working tree clean`.

- [ ] **Step 10.2: Confirm commit log shape**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && git log --oneline -8
```

Expected: the most recent commits should include (top-down):

```
... docs: add CLAUDE.md for AI-agent orientation
... docs(index): add missing references ...
... docs(spec): bump to 1.1.0 — React 19, @tanstack/ai-* ...
... docs(readme): sync with current modules, scripts, locales and stack
... docs(architecture): migrate dbUpdates.txt → multi-tenancy-and-rls-notes.md
... chore: remove stale root-level files and untrack env.zip
... docs: add documentation-refresh plan
```

- [ ] **Step 10.3: Spot-check rendered links by listing referenced files**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && for f in CLAUDE.md docs/README.md docs/architecture/multi-tenancy-and-rls-notes.md docs/architecture/authorization-hardening-plan.md docs/ai/README.mdx; do test -f "$f" && echo "✓ $f" || echo "✗ MISSING: $f"; done
```

Expected: all five lines start with `✓`.

- [ ] **Step 10.4: Confirm gone files are gone**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && for f in agent.md dbUpdates.txt "Por favor lee y entiendo el documento, c.ts"; do test -e "$f" && echo "✗ STILL THERE: $f" || echo "✓ removed: $f"; done
```

Expected: all three lines start with `✓ removed`.

- [ ] **Step 10.5: Cross-check key facts in updated docs**

Run:

```bash
cd /Volumes/Works/github/iaWorkSpace/apps/edd-app-template && \
echo "--- README module count ---" && \
grep -E '^├──|^└──' README.md | wc -l && \
echo "--- src/modules count ---" && \
ls -d src/modules/*/ | wc -l && \
echo "--- DK locale mentioned in README ---" && \
grep -c "DK" README.md && \
echo "--- SPEC React 19 ---" && \
grep -c "React 19" SPEC.md
```

Expected:

- README module count = 12 (12 entries since `index.ts` is not a directory)
- src/modules count = 12 (excluding `index.ts`)
- DK count ≥ 1
- React 19 count ≥ 1

---

## Self-review (pre-handoff)

**Spec coverage** — original scope per user:

| Requested                   | Plan task                              |
| --------------------------- | -------------------------------------- |
| Fix README.md               | Task 6                                 |
| Fix SPEC.md                 | Task 7                                 |
| Fix docs/README.md          | Task 8                                 |
| Create CLAUDE.md            | Task 9                                 |
| Delete broken-name .ts file | Task 2                                 |
| Delete obsolete agent.md    | Task 3                                 |
| Reubicar dbUpdates.txt      | Task 5                                 |
| Investigate env.zip         | Task 4 (decided: untrack + .gitignore) |

All eight requirements covered.

**Placeholder scan** — none. The dbUpdates.txt content insertion (Step 5.2) is bracketed because we must paste the actual file content at run time, but Step 5.1 reads the source and the instruction tells the engineer to insert verbatim from line 8 onwards. That is concrete enough.

**Type / name consistency** — file paths consistent across tasks (`docs/architecture/multi-tenancy-and-rls-notes.md` used in Tasks 5, 6.5, 8.2, 10.3). Module count claim (12) consistent between Step 6.2 and Step 10.5.

---

## Out of plan scope

- Cleaning `env.zip` from git history (BFG / filter-repo)
- Reviewing actual contents of `env.zip` for leaked secrets
- Updating any module-level READMEs under `src/modules/<x>/README.md`
- Writing or updating ADRs
- Generating fresh content for `docs/architecture/multi-tenancy-and-rls-notes.md` beyond the verbatim migration of `dbUpdates.txt`
