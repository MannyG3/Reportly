# Reportly

Reportly is a multi-tenant white-label reporting platform for agencies. It lets teams onboard clients, generate reports, and share results through secure links.

This repository contains:

- SQL setup scripts for Supabase
- A Next.js application inside [reportly](reportly)
- Supporting docs for local setup and deployment

## What the app does

- Agency account signup and login
- Dashboard with client/report stats
- Client and report management views
- Public report sharing via tokenized URLs
- Stripe hooks for subscription lifecycle events

## Tech stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Auth + Postgres)
- Stripe (billing + webhook integration)
- Vercel (deployment)

## Repository layout

- [reportly](reportly): Main Next.js application
- [SETUP.md](SETUP.md): Supabase and environment setup guide
- [COMPLETE_SETUP.sql](COMPLETE_SETUP.sql): SQL bootstrap script
- [INDEXES.sql](INDEXES.sql): Additional indexes and performance helpers

## Quick start

1. Go to the app folder.

```bash
cd reportly
```

2. Install dependencies.

```bash
npm install
```

3. Create [reportly/.env.local](reportly/.env.local) with at least:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

4. Run local development server.

```bash
npm run dev
```

5. Open http://localhost:3000

For full DB policies and optional Stripe setup, see [SETUP.md](SETUP.md).

## Runtime flow (current behavior)

- [reportly/src/app/page.tsx](reportly/src/app/page.tsx): Public landing page at `/`
- [reportly/middleware.ts](reportly/middleware.ts): Protects `/dashboard`, `/app`, `/settings`, `/clients`, `/reports`
- Unauthenticated access to protected routes redirects to `/login?redirect=<path>`

## Environment variables

Required for auth/app functionality:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for billing flows:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_STARTER`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_ENTERPRISE`

## Build and deploy

Build locally:

```bash
cd reportly
npm run build
```

Deploy to Vercel from app folder:

```bash
cd reportly
npx vercel --prod
```

## Notes

- The deployable application root is [reportly](reportly), not the repository root.
- Keep service role keys private and only in server-side environment variables.