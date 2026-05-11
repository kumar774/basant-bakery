# Sweet Crumbs Bakery Management

A premium 3D bakery management web app for managing orders, customers, payments, and analytics for a bakery business.

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
  - `src/pages/` — All page components
  - `src/components/orders/OrderForm.tsx` — Reusable order form (create + edit)
  - `src/components/ThreeBackground.tsx` — 3D background with WebGL fallback
  - `src/components/ThreeScene.tsx` — Three.js scene (floating bakery shapes)

## Architecture decisions

- Supabase Auth is used for authentication only; all bakery data lives in Replit's managed PostgreSQL via Drizzle ORM.
- Three.js 3D background on the login page gracefully degrades to a CSS gradient when WebGL is unavailable (e.g. in headless/sandboxed environments).
- The remaining_balance field is auto-computed on the server when creating/updating orders (total - advance).
- Payment status is auto-set by the server: Paid when balance=0, Partial when advance>0, Unpaid otherwise.
- All API endpoints validated with Zod schemas generated from OpenAPI spec via Orval.

## Product

- Secure login/signup via Supabase Auth
- Dashboard: 8 stat cards (today's orders, pending, deliveries, completed, total/monthly revenue, pending payments, customers), category pie chart, recent activity feed
- Orders: searchable/filterable table with all fields, edit modal, delete with confirm, mark-as-paid button, CSV export
- New Order form: all fields with auto-calculated remaining balance, Zod validation
- Customers: aggregated view from order data (name, phone, total orders, total spent, last order)
- Analytics: revenue area chart (7/14/30 day toggle), category breakdown bar chart
- Settings: dark/light theme toggle
- Toast notifications (sonner), glassmorphism cards, framer-motion animations
- Responsive sidebar navigation with mobile support

## User preferences

- Use Supabase Auth for login/signup
- Dark mode default (warm espresso/amber palette)
- Premium, polished UI — glassmorphism, floating cards, smooth animations

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after every DB schema change
- Three.js WebGL requires a real browser GPU context — the preview sandbox may show the gradient fallback instead of 3D shapes (normal behavior; works in real browsers)
- Supabase URL is set as env var `VITE_SUPABASE_URL`; the anon key is a secret `VITE_SUPABASE_ANON_KEY`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
