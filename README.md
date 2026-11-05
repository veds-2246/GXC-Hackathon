# GenXCode Tech Fest

Registration and event management platform for the GenXCode Tech Fest.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL and Auth)
- Vercel deployment

## Getting started

Use Node.js 22. Run:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

## Environment variables

Set the following values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never expose Supabase secret or service-role keys through `NEXT_PUBLIC_*` variables.

## Current milestone

- [x] Initial Next.js application structure
- [x] Code Meets Classic visual foundation
- [x] Responsive event landing page
- [ ] Supabase project connection
- [ ] Authentication and role model
- [ ] Registration and payment workflow
