FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --frozen-lockfile

FROM base AS dev

WORKDIR /app

COPY . .

EXPOSE 2999

CMD ["pnpm", "dev:server", "--host", "0.0.0.0", "--port", "2999"]

FROM base AS builder

WORKDIR /app

COPY . .

RUN pnpm build

FROM node:22-bookworm-slim AS prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Reuse compiled node_modules from base — avoids re-running native binary builds
COPY --from=base /app/node_modules ./node_modules
# --ignore-scripts because prune removes devDependencies and then runs the
# `prepare` lifecycle, which is `husky` — now uninstalled. `sh: 1: husky: not
# found` failed every production image build, and nothing noticed because no
# workflow built one. Nothing here needs a lifecycle script to run.
RUN pnpm prune --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY server.prod.mjs ./server.prod.mjs

EXPOSE 2999

# Docker reports health, not Coolify. Coolify's own probe shells out to curl or
# wget inside the container, and node:22-bookworm-slim has neither — the first
# deploy built fine, the server logged "Listening on http://0.0.0.0:2999", and
# Coolify rolled it back over ten failed `curl: not found` probes.
#
# node's fetch is already in the image. The endpoint is deliberately shallow
# (no database touch): database liveness belongs to the database's own
# healthcheck, and coupling them turns planned maintenance into a rollback.
# start-period covers the TanStack Start server boot.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||2999)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.prod.mjs"]