# Basant Bakery Management

A premium mobile-first bakery management web app for managing orders, customers, payments, and analytics. Pickup-only workflow (no delivery), Hindi/English bilingual, WhatsApp order sharing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bakery-app run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `VITE_SUPABASE_URL` — Supabase project URL
- Required secrets: `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, framer-motion, recharts
- 3D: @react-three/fiber + @react-three/drei (with WebGL fallback gradient)
- Auth: Supabase Auth (email/password, sign in + sign up)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/orders.ts` — Orders table schema (Drizzle)
- `artifacts/api-server/src/routes/` — Backend route handlers (orders, customers, analytics)
- `artifacts/bakery-app/src/` — Frontend React app
  - `src/lib/supabase.ts` — Supabase client
  - `src/contexts/AuthContext.tsx` — Auth state provider
  - `src/contexts/LanguageContext.tsx` — Hindi/English i18n provider with all UI strings
  - `src/pages/` — All page components
  - `src/components/orders/OrderForm.tsx` — Reusable order form (create + edit)
  - `src/components/layout/AppLayout.tsx` — Mobile header + bottom nav layout
  - `src/components/layout/BottomNav.tsx` — Animated bottom navigation bar (5 tabs + FAB)
  - `src/components/ThreeBackground.tsx` — 3D background with WebGL fallback
  - `src/components/ThreeScene.tsx` — Three.js scene (floating bakery shapes)

## Architecture decisions

- **Mobile-first**: Bottom navigation bar replaces sidebar. FAB (+) for new order. All pages use card-based layouts with large touch targets.
- **Pickup-only workflow**: "delivery_date" DB column is labeled "Pickup Date" in UI. No delivery address. Order statuses: Pending → In Progress → Ready → Collected (maps to "Delivered" in DB).
- **Auto payment status**: Computed server-side. advance=0 → Unpaid, 0 < advance < total → Partial, remaining=0 → Paid. Payment status not editable in form.
- **WhatsApp share**: Each order card has a WhatsApp button that opens wa.me with pre-filled order details in the active language.
- **Hindi/English**: LanguageContext with full translations. Toggle in Settings. Persisted to localStorage.
- Supabase Auth is used for authentication only; all bakery data lives in Replit's managed PostgreSQL via Drizzle ORM.
- Three.js 3D background on the login page gracefully degrades to a CSS gradient when WebGL is unavailable.
- All API endpoints validated with Zod schemas generated from OpenAPI spec via Orval.

## Product

- **Login**: Branded with "Basant Bakery", 🍞 icon, warm amber glassmorphism card, 3D background
- **Dashboard**: 8 stat cards (2-column grid), category pie chart, recent activity feed
- **Orders**: Card-based list, search/filter, WhatsApp share per order, edit modal, mark-paid, CSV export
- **New Order**: Full form with auto-computed payment status badge, pickup date, notes
- **Customers**: Card list with avatar, total orders, total spent, last order date
- **Analytics**: Revenue area chart (7/14/30 day), category bar + pie charts
- **Settings**: Dark/light toggle, EN/हि language switcher, sign-out with user card
- Toast notifications, glassmorphism cards, framer-motion page transitions + card animations

## User preferences

- Branding: "Basant Bakery" (was "Sweet Crumbs")
- Use Supabase Auth for login/signup
- Dark mode default (warm espresso/amber palette)
- Premium, polished mobile-first UI — glassmorphism, 3D cards, smooth animations
- Hindi and English language support
- Pickup-only (no delivery)

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after every DB schema change
- Three.js WebGL requires a real browser GPU context — preview sandbox shows gradient fallback (normal behavior)
- "delivery_date" in DB/API is displayed as "Pickup Date" everywhere in UI
- "Delivered" in DB order_status is displayed as "Collected" in UI
- Supabase URL is set as env var `VITE_SUPABASE_URL`; the anon key is a secret `VITE_SUPABASE_ANON_KEY`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
