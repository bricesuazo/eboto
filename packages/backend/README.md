# @eboto/backend

The Convex backend — schema, queries, mutations, and auth — for eBoto v2.
Lives outside any single app so multiple frontends (web, mobile, ops tools)
can consume the same deployment.

## Layout

```
packages/backend/
├── convex.json              # Convex project config (functions dir)
├── convex/
│   ├── _generated/          # auto-generated, gitignored
│   ├── auth.config.ts       # JWT issuer config
│   ├── auth.ts              # Convex Auth (Google + magic link)
│   ├── elections.ts         # public election queries
│   ├── http.ts              # HTTP routes (auth, webhooks, OG)
│   ├── schema.ts            # domain schema
│   └── users.ts             # current-user query
└── package.json             # exports api/ data-model/ schema/ auth
```

## Consuming from an app

```ts
// apps/web/src/router.tsx
import { ConvexReactClient } from 'convex/react';

// apps/web/src/routes/$electionSlug/index.tsx
import { api } from '@eboto/backend/api';
import type { Doc, Id } from '@eboto/backend/data-model';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

useQuery(api.elections.getBySlug, { slug });
```

The package exports:

- `@eboto/backend/api` — generated function references (`api`, `internal`).
- `@eboto/backend/data-model` — `Doc<T>`, `Id<T>`, `DataModel`.
- `@eboto/backend/schema` — the schema definition (rarely imported by apps).
- `@eboto/backend/auth` — exports of `auth`, `signIn`, `signOut`, `store`.

## Running

```bash
# from repo root
pnpm install

# first-time setup: provisions a deployment, writes CONVEX_DEPLOYMENT
# and VITE_CONVEX_URL into ../../.env, generates convex/_generated.
pnpm dev
```

Then configure auth secrets in the Convex dashboard:

- `npx @convex-dev/auth` (run from this directory) → generates
  `JWT_PRIVATE_KEY` + `JWKS`.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` for OAuth.
