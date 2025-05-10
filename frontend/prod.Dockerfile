FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY frontend/pnpm-lock.yaml frontend/package.json ./

ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm install --frozen-lockfile

COPY frontend ./

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]