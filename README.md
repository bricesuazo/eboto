[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bricesuazo/eboto)

# [eBoto](https://eboto.app) - Your One-Stop Online Voting Solution

Empower your elections with eBoto, the versatile and web-based voting platform that offers secure online elections for any type of organization.

- **Monorepo**: [TurboRepo](https://turbo.build/) + [pnpm](https://pnpm.io/)
- **Framework**: [TanStack Start](https://tanstack.com/start) (Vite + React, SSR)
- **Backend**: [Convex](https://convex.dev/) — schema, queries, mutations, storage, auth
- **Auth**: [`@convex-dev/auth`](https://labs.convex.dev/auth) (magic link + Google)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide](https://lucide.dev/)
- **Forms**: [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Jobs**: [Inngest](https://www.inngest.com/) (served from `/api/inngest`)
- **Payment**: [Lemon Squeezy](https://www.lemonsqueezy.com/) (webhook at `/api/billing/webhook`)
- **Deployment**: [Vercel](https://vercel.com) (or any Node-compatible host) + Convex Cloud

## Running locally

```bash
git clone https://github.com/bricesuazo/eboto.git
cd eboto
pnpm install

# provisions a Convex deployment, generates types, writes
# CONVEX_DEPLOYMENT + VITE_CONVEX_URL into ./.env
pnpm dev
```

Copy `.env.example` to `.env` for the rest of the optional env vars.
Configure Convex Auth secrets (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`) in the Convex dashboard.

## Running with Docker

The web container uses an existing Convex deployment. Payment credentials are
optional for starting the app and are only needed when a user opens checkout.

```bash
docker compose up --build                         # production image
docker compose --profile dev up --build web-dev   # Vite hot reload
```

The development Compose profile starts a local Convex backend and defaults the
browser URL to `http://localhost:3210`:

```bash
docker compose --profile dev up --build
```

For self-hosting, copy `.env.selfhost.example` to `.env` and adjust the public
hostnames or ports as needed. The Lemon Squeezy and email variables may remain
blank when running the free/local workflow.

### Open the Convex dashboard

Start the self-hosted services, then generate an admin key for the dashboard:

```bash
docker compose up -d
docker compose exec backend ./generate_admin_key.sh
```

Copy the generated key and open [http://localhost:6791](http://localhost:6791).
When prompted, enter the admin key to access the self-hosted Convex dashboard.
Keep this key private. If you changed `DASHBOARD_PORT` in `.env`, use that port
instead of `6791`.

The production image requires Convex generated files. For a cloud deployment,
pass `CONVEX_DEPLOY_KEY` during the build. For self-hosted Convex, run codegen
before building with a supported Convex project setup and keep the generated
`packages/backend/convex/_generated` files in the Docker build context.

Set `VITE_CONVEX_URL` only when connecting the frontend to a different Convex
deployment. Add the Lemon Squeezy variables from `.env.example` only when
testing paid checkout or the webhook.

Set `PAYMENTS_ENABLED=true` only when Lemon Squeezy is configured. Keep it
`false` to detach the payment gateway from a self-hosted deployment.

To print the URLs published by the local Convex backend:

```bash
pnpm convex:local-url
pnpm convex:local-site-url
```

## Layout

```
apps/web              TanStack Start frontend
packages/backend      Convex deployment (schema, queries, mutations, auth)
tooling/{eslint,prettier,tsconfig}   shared dev configs
```

## License

This project is licensed under the GNU Affero General Public License v3.0 — see [LICENSE](LICENSE) for details.
