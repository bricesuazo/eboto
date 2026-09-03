FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json skills-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/inngest/package.json packages/inngest/package.json
COPY tooling/eslint/package.json tooling/eslint/package.json
COPY tooling/prettier/package.json tooling/prettier/package.json
COPY tooling/tsconfig/package.json tooling/tsconfig/package.json
RUN pnpm install --frozen-lockfile --config.confirmModulesPurge=false

FROM base AS build

ENV SKIP_ENV_VALIDATION=true
WORKDIR /app

COPY . .

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV CI=true
ENV PORT=3000
WORKDIR /app

COPY --from=build /app/apps/web/.output .output

EXPOSE 3000
CMD ["node", "apps/web/.output/server/index.mjs"]