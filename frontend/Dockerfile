# syntax=docker/dockerfile:1.7
# Production image. All configuration is read at runtime (see src/lib/env),
# so the same image runs in every environment.

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
# pnpm version comes from package.json's "packageManager" field.
RUN corepack enable
WORKDIR /app

# ── Dependencies (cached until the lock file changes) ──────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build ──────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── Runtime: standalone server only, non-root ──────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
