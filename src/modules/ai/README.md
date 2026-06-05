# AI Module

The largest module in the catalog. It is a **pluggable multi-provider AI
runtime** with chat streaming, RAG (Retrieval-Augmented Generation) over a
ChromaDB vector store, action-card confirmations, audit logging, and a
configuration UI that lets the user switch providers at runtime.

> This is the most complex module to copy. It pulls in 5 AI provider
> adapters, a ChromaDB client, an audit log store, and a runtime that
> expects a directory on disk for config and history.

## What it does

- **Multi-provider chat** — one abstraction over OpenAI, Anthropic,
  Ollama, LM Studio, llama.cpp, and `minimax` (an internal/minimax
  provider). Switch with `pnpm ai:switch`.
- **RAG pipeline** — `scripts/ai/ingest-rag.ts` ingests documents into a
  ChromaDB collection; `rag/retrieval.ts` fetches the top-k matching
  chunks at chat time and injects them into the system prompt.
- **Streaming chat** — `server/chat-streaming.ts` exposes an SSE
  endpoint at `/api/ai/chat/completions` for token-by-token UI updates.
- **Action cards** — the model can request structured actions
  (e.g. "create a user"), which are surfaced in the UI as
  `ActionConfirmationCard`s that the user must approve before they run.
- **Audit trail** — every configuration change and every chat turn is
  persisted to `src/modules/ai/data/audit-logs.json` (and an
  `app-knowledge.json` for RAG).
- **Sidebar entry** — the `ai-search` action in `manifest.ts` opens a
  global `Cmd+K`-style search panel (`AiSearchProvider` context).

## File map

```
src/modules/ai/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'ai')
├── api/
│   └── search.fn.ts          # buildProviderModelOptions, formatKnowledgeBase
├── audit/
│   ├── audit.ts
│   └── index.ts
├── components/
│   ├── ActionConfirmationCard.tsx
│   ├── ActionConfirmationCard.utils.ts
│   ├── ActionStatesContext.tsx
│   ├── ConversationPanel.tsx
│   ├── HelpChatPage.tsx      # the /help/chat page
│   ├── action-card/
│   │   ├── ActionCardContent.tsx
│   │   ├── ActionCardFooter.tsx
│   │   └── ActionCardHeader.tsx
│   └── useActionStates.ts
├── config/
│   ├── defaults.ts           # default provider configs
│   ├── file-store.ts         # read/write the on-disk config file
│   ├── index.ts              # public types + helpers
│   ├── resolver.ts
│   ├── schema.ts             # Zod schemas for AiConfigFormData
│   └── store.ts
├── context/
│   ├── AiSearchContext.tsx
│   └── useAiSearch.tsx
├── data/                     # on-disk config + logs (committed for dev)
│   ├── ai-config-store.json
│   ├── ai-settings.json
│   ├── app-knowledge.json
│   └── audit-logs.json
├── prompts/
│   ├── chat.ts
│   ├── index.ts
│   └── search.ts
├── providers/                # one folder per provider
│   ├── README.md
│   ├── anthropic/    (adapter, config, index, models, probe, types)
│   ├── llama-cpp/    (adapter, config, index, models, probe, types)
│   ├── lmstudio/     (adapter, config, index, models, probe, types)
│   ├── minimax/      (adapter, config, index, models, probe, types)
│   ├── ollama/       (adapter, config, index, models, probe, types)
│   ├── openai/       (adapter, config, index, models, probe, types)
│   ├── headers.ts
│   ├── model-discovery.ts
│   ├── probe.ts
│   ├── registry.ts
│   ├── shared.ts
│   └── types.ts
├── rag/
│   ├── chroma-client.ts      # ChromaDB HTTP client
│   ├── context.ts            # assembles the RAG context for a query
│   ├── embeddings.ts         # default embedder (@chroma-core/default-embed)
│   ├── index.ts
│   ├── retrieval.ts          # top-k fetch
│   └── sync.ts               # one-shot sync from data/ → chroma
├── server/
│   ├── ai-preflight.ts
│   ├── audit-store.ts
│   ├── chat-execution.ts
│   ├── chat-messages.ts
│   ├── chat-streaming.ts     # SSE for /api/ai/chat/completions
│   ├── config-store.ts
│   ├── data-paths.ts
│   ├── errors.ts
│   ├── http.ts
│   ├── index.ts
│   ├── model-discovery.ts
│   ├── provider-models.ts
│   ├── provider-resolution.ts
│   ├── provider-runtime.ts
│   └── provider-status.ts
└── storage/
    ├── chat-storage.ts
    └── index.ts
```

## Public API

```ts
// from '@/modules/ai'
export * from './api/search.fn'
export { HelpChatPage } from './components/HelpChatPage'
export { AiSearchProvider } from './context/AiSearchContext'
export { useAiSearch } from './context/useAiSearch'
export type {
  AiConfigAuditLog,
  AiConfigFormData,
  AiConfigStore,
  AiProvider,
  AiProviderId,
} from './config'
export { buildDefaultConfig, normalizeConfig, normalizeStore } from './config'
export type { AiProviderStatus } from './providers/types'
export { getProviderHeaders } from './providers'
export * as aiRuntimeConfig from './config'
export * as aiRuntimeProviders from './providers'
export * as aiRuntimeRag from './rag'
export * as aiRuntimeStorage from './storage'
```

## Dependencies

### Other modules (declared in the manifest)

None. But it is heavily imported by:

- `settings` — for `AiConfigForm`, `AiLogsPage`, `useAiConfigStore`,
  `useAiProviderStatuses`.
- `dashboard` — `NotificationBell` reads AI provider status.

### Cross-module imports inside `ai/`

- `@/modules/core` — for the manifest type and `WidgetDefinition`.
- `@/modules/settings` — historical: the config form used to live in
  `ai`; it has been moved to `settings`, but a few imports remain for
  backwards compatibility.
- `@/modules/users` — `userId` is recorded in audit logs.

### NPM packages used

- `@anthropic-ai/sdk` — Anthropic Claude provider.
- `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai` —
  TanStack AI unified client.
- `@chroma-core/default-embed` — local embeddings for RAG.
- `chromadb` — ChromaDB HTTP client.
- `@tanstack/react-form` — `AiConfigForm` (in settings, but uses shared
  types from here).
- `react-markdown` + `remark-gfm` + `react-syntax-highlighter` — render
  AI responses with code blocks.
- `framer-motion` — chat bubble animations.
- `lucide-react` — icons.
- `react-i18next` — translations.
- `react`, `react-dom`.
- `zod` — config schema validation.

### Environment variables

| Variable                   | Effect                                           |
| -------------------------- | ------------------------------------------------ |
| `VITE_AI_DEFAULT_PROVIDER` | Provider id used when the config store is empty. |
| `AI_PROVIDER`              | Server-side default.                             |
| `OPENAI_API_KEY`           | Required by the OpenAI provider.                 |
| `ANTHROPIC_API_KEY`        | Required by the Anthropic provider.              |
| `OLLAMA_BASE_URL`          | Default `http://localhost:11434`.                |
| `LMSTUDIO_BASE_URL`        | Default `http://localhost:1234`.                 |
| `LLAMA_CPP_BASE_URL`       | Default `http://localhost:8080`.                 |
| `VITE_CHROMA_URL`          | Default `http://localhost:8000`.                 |
| `VITE_CHROMA_COLLECTION`   | Default `app-knowledge`.                         |
| `VITE_RAG_TOP_K`           | Default `5`.                                     |
| `VITE_RAG_MIN_SCORE`       | Default `0.0`.                                   |

### Shared infrastructure required

- `@/components/ui/*` — full shadcn/ui set.
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/db` — Drizzle client (the audit log uses the `users`
  table for `userId`).
- `@/shared/lib/auth/app-auth` — to know who is making the call.
- `@/shared/lib/storage` — `localStorage` helpers used for the
  `ai-settings.json` mirror.

### External services

- **ChromaDB** — required if you want RAG. Runs in Docker (see
  `docker-compose.yml`).
- **At least one AI provider** — the app degrades gracefully when no
  provider is configured (the AI search panel is still openable but
  returns an error).

## How to copy this module to another project

This is a large copy. Plan for a half-day.

1. **Copy `src/modules/ai/`** (this entire folder, ~80 files).
2. **Bring the shared pieces** — see list above.
3. **Add file-based routes** for the AI server endpoints:

   ```tsx
   // src/routes/api/ai/chat.ts
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { chatStreamingHandler } from '@/modules/ai/server'

   export const Route = createAPIFileRoute('/api/ai/chat')({
     GET: chatStreamingHandler,
   })
   ```

   Or use the manifest route declarations (`/api/ai/audit`,
   `/api/ai/chat`, `/api/ai/chat/completions`, `/api/ai/config-store`,
   `/api/ai/models`, `/api/ai/search`, `/api/ai/status`,
   `/api/ai/test-connection`) and wire each one to the matching handler
   from `@/modules/ai/server`.

4. **Wire ChromaDB** in `docker-compose.yml`:
   ```yaml
   services:
     chromadb:
       image: chromadb/chroma:latest
       ports: ['8000:8000']
       volumes: ['./.docker_data/chromadb:/chroma/chroma']
   ```
5. **Set the env vars** (at minimum):
   ```bash
   OPENAI_API_KEY=sk-...
   VITE_CHROMA_URL=http://localhost:8000
   ```
6. **Register the module** in `src/modules/index.ts` and add `aiModule`
   to `core/registry.ts`. (The template already has the import.)
7. **Bring the `settings` module** if you want the AI config form to be
   reachable from the sidebar. The `settings` module reads from
   `aiRuntimeConfig` and writes to `src/modules/ai/data/ai-config-store.json`.
8. **(Optional) Ingest documents for RAG**:
   ```bash
   pnpm rag:ingest
   ```
   This walks `src/modules/ai/data/app-knowledge.json` and pushes the
   entries into ChromaDB.
9. **Install missing dependencies**:
   ```bash
   pnpm add @anthropic-ai/sdk @chroma-core/default-embed chromadb \
              @tanstack/ai @tanstack/ai-anthropic @tanstack/ai-openai \
              react-markdown remark-gfm react-syntax-highlighter
   ```

## Configuration knobs

- **Add a new provider** — copy one of the folders under `providers/*`
  (e.g. `providers/openai/`), give it a new id, register it in
  `providers/registry.ts`, and add the id to `AI_PROVIDER_IDS` in
  `config/schema.ts`. The provider form, model discovery, and audit
  log will pick it up automatically.
- **Change the default model** — edit `providers/<id>/models.ts` (the
  `defaultModel` field) and the matching entry in
  `config/defaults.ts`.
- **Disable RAG** — set `VITE_RAG_TOP_K=0` in `.env`. The chat will
  skip retrieval.
- **Persist chat history** — `storage/chat-storage.ts` writes to
  `localStorage` by default; swap in your own adapter (Postgres, Redis,
  S3, etc.) and re-export from `storage/index.ts`.

## Anti-patterns

- Do not call a provider's SDK directly from a page or component. Go
  through `@/modules/ai/server/*` so provider switching, retries,
  and audit logging stay centralized.
- Do not commit `data/audit-logs.json` to production — it grows
  unbounded. Add it to `.gitignore` and rotate the file on a schedule.
- Do not put user-facing prompts in `prompts/*.ts` that contain
  secrets. Prompts are bundled into the client.
- Do not call ChromaDB from a client component — it must go through
  `rag/index.ts` which runs server-side.
