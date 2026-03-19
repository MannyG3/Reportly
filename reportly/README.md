# Reportly App

This is the deployable Next.js application for Reportly.

## Features

- Public landing page at `/`
- Authentication pages at `/login` and `/signup`
- Protected app routes such as `/dashboard`, `/clients`, `/reports`, `/settings`
- Report sharing endpoint at `/r/[token]`
- Supabase-backed auth/data layer
- Stripe webhook endpoint at `/api/webhooks`

## Local development

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local` in this folder with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Optional for billing:

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

3. Start dev server.

```bash
npm run dev
```

4. Open http://localhost:3000

## Commands

- `npm run dev`: Start local dev server
- `npm run build`: Create production build
- `npm run start`: Run production server locally
- `npm run lint`: Run lint checks

## Auth behavior

- `/` is public and renders landing content
- Middleware protects only app routes
- Unauthenticated users are redirected to `/login` for protected pages

## Deployment

Deploy from this folder:

```bash
npx vercel --prod
```

If environment variables are changed in Vercel, redeploy to apply them.

## More setup details

For full Supabase table/RLS setup, see [../SETUP.md](../SETUP.md).
