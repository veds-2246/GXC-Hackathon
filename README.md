# GenXCode Tech Fest

Registration and event management platform for the GenXCode Tech Fest.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL and Auth)
- Vercel deployment
- npm for package management

## Getting started

Use Node.js 22. Run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

Set the following values in `.env.local` when connecting Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The static landing page can run before these values are configured. Never expose Supabase secret or service-role keys through `NEXT_PUBLIC_*` variables.

## Current milestone

- [x] Initial Next.js application structure
- [x] Code Meets Classic visual foundation
- [x] Responsive event landing page
- [ ] Supabase project connection
- [ ] Authentication and role model
- [ ] Registration and payment workflow
