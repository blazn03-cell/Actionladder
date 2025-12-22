<!-- ActionLadder — repo-specific Copilot instructions -->
# ActionLadder — Copilot Instructions

Purpose: give AI coding agents the minimum, high‑value facts to be productive in this monorepo.

- Big picture
  - Monorepo with three main apps: `client/` (Vite React SPA), `server/` (Express + TypeScript API), and `mobile-app/` (Expo wrapper). See [client/package.json](client/package.json), [server/index.ts](server/index.ts), and [mobile-app/README.md](mobile-app/README.md).
  - Shared types and DB schema live in `shared/` and are published as the workspace package `action-ladder-shared`. Primary schema: [shared/schema.ts](shared/schema.ts).
  - The server is a pure API server (client runs separately). Routes are modular: feature files export `setupXRoutes(...)` and are registered centrally in [server/routes.ts](server/routes.ts).

- Developer workflows (commands you can run)
  - Full dev (runs client + server): root `npm run dev` (uses `concurrently`).
  - Client: `cd client && npm run dev` (Vite). Server: `cd server && npm run dev` (uses `tsx index.ts`).
  - Build: root `npm run build` → runs `build:client` (Vite) and `build:server` (esbuild to `server/dist`).
  - Production start: `cd server && npm start` (expects `server/dist/index.js`).
  - Type checks: root `npm run check` (runs `tsc --noEmit` in client and server).
  - DB schema push (Drizzle): `cd server && npm run db:push` or root `npm run db:push`.

- Environment & runtime notes
  - `STRIPE_SECRET_KEY` is required at startup (checked in [server/routes.ts](server/routes.ts)).
  - `PORT` defaults to `5000` in [server/index.ts](server/index.ts).
  - Several Stripe price IDs are read from env vars (e.g. `SMALL_PRICE_ID`, `MEDIUM_PRICE_ID`, `LARGE_PRICE_ID`, `MEGA_PRICE_ID`).
  - `REPLIT_DOMAINS` is used for production CORS settings.

- Project-specific patterns and conventions
  - Route registration: add route modules under `server/routes/` that export a `setupXRoutes(app, storage, ...?)` function and then register it in [server/routes.ts](server/routes.ts).
  - Services live under `server/services/` and are often initialized lazily with dynamic `import()` (see revenue config and schedulers in [server/index.ts](server/index.ts)).
  - Storage abstraction: `server/storage.ts` provides a pluggable storage instance (Replit object storage / GCS). Use the exported `storage` instance passed into route setup functions.
  - Shared DB models and validation use `drizzle-orm` + `drizzle-zod`. Prefer using `createInsertSchema` from `drizzle-zod` and Zod types from `shared/schema.ts`.
  - Outgoing-response sanitization is globally applied via `sanitizeResponse()` middleware in [server/routes.ts](server/routes.ts).

- Integrations to be aware of
  - Stripe (payments, webhooks): price IDs and `STRIPE_SECRET_KEY`. Watch for webhook routes and `webhook_events` handling.
  - Supabase authentication (`server/supabaseAuth.ts`) — authentication is set up early in route registration.
  - Socket.IO for real-time challenge updates (see `services/challengeSocketEvents`).
  - Email (SendGrid), OpenAI agents, Tesseract OCR, Google Cloud Storage are used across services — check `server/package.json` for dependencies.

- Quick editing examples
  - To add a new API area "foo": create `server/routes/foo.routes.ts` with `export function setupFooRoutes(app, storage) { ... }`, then import and call `setupFooRoutes(app, storage)` in [server/routes.ts](server/routes.ts).
  - To update DB schema: edit `shared/schema.ts` or server-side drizzle definitions, then run `cd server && npx drizzle-kit push` (or `npm run db:push`).

- What to avoid / gotchas
  - Do not assume server serves the client; client is independent and runs on Vite port in dev.
  - `STRIPE_SECRET_KEY` missing will throw at startup; run server with env set when testing payment or price-related code.
  - Some rate-limiting middleware intentionally skips webhook routes — be careful when testing webhooks.

If anything here is unclear or you'd like more detail on a subsection (DB migrations, auth flow, or adding a new scheduler), say which area and I'll expand the document with examples.
