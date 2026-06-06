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

## Layout

```
apps/web              TanStack Start frontend
packages/backend      Convex deployment (schema, queries, mutations, auth)
tooling/{eslint,prettier,tsconfig}   shared dev configs
```

## License

This project is licensed under the GNU Affero General Public License v3.0 — see [LICENSE](LICENSE) for details.
