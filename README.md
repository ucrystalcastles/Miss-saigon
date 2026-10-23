# Miss Saigon · Menu Mentor

Bilingual (EN/DE) drinks learning for the Miss Saigon team: menu cards with original photos, short or full lessons, matching, multiple choice, true/false, ingredient explanations and guest recommendations.

This repository targets **Vercel + Supabase**. The browser uses one Vercel origin; the server holds all database and storage credentials. No AI is used at runtime.

## Deploy — instructions in Russian

Follow **[docs/DEPLOY-RU.md](docs/DEPLOY-RU.md)**. You need a Vercel account, a Supabase project and access to this repository.

1. Run [supabase/setup.sql](supabase/setup.sql) in the Supabase SQL Editor.
2. If transferring an existing menu/progress, import your private snapshot **before the first training login**. It is not stored in this public repository.
3. Import this repository in Vercel. Framework: **Other**. The build and output directory are configured in `vercel.json`.
4. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `APP_PIN` in Vercel's Environment Variables. Mark the server key and PIN as sensitive.
5. Deploy. The resulting address is `your-project.vercel.app`; ChatGPT sign-in is not needed.

## Architecture

- `src/`: browser application, learning data and question logic.
- `server/handler.js`: the API on Node.js, with the same PIN and lesson workflows.
- `server/supabase.js`: server-only PostgREST/Storage client. Does not expose the Supabase key to the browser.
- `api/index.js`: Vercel function. Rewrites keep `/api/*` on the same origin as the app.
- `supabase/setup.sql`: private database schema, server-only RPCs, transaction-safe answer recording, and a private originals bucket.
- `public/drink-photos/`: drink images extracted from the supplied menu. Wine glasses are explicitly illustrative.
- `src/worker.js`, `src/pin-auth.js`: retained legacy implementation, covered by regression tests; Vercel does not deploy that Worker.
- `scripts/`: optional private export/import and PIN-hash utilities.

## Data protection

The current prototype has a **shared team PIN and shared learning progress**. Anyone with that PIN can use menu management. Individual staff accounts are not implemented yet.

Supabase tables have RLS enabled and are not exposed directly. The RPC functions are granted only to `service_role`; an anon/publishable key cannot call them. Uploaded originals stay in a private bucket. File upload uses a short-lived signed URL from the authenticated server, so 15 MB originals do not pass through Vercel's function-body limit. Extracted menu JSON is limited to 3 MB per request.

The service key and actual production PIN are not in this repository. Do not add `.env`, private progress snapshots, or live credentials to Git. Keep Vercel Preview deployments on a separate Supabase project if you do not want previews to share production data.

## Local checks

Requires Node.js 24.

```sh
npm ci
npm test
npm run build
```

Tests cover the legacy SQLite flows, question generation, UI handlers and the new PostgreSQL/Supabase integration. The PostgreSQL suite uses PGlite to execute the real setup SQL, including RPC and permission checks. Production Supabase credentials are not needed for these tests.

For a local application server, configure an untracked `.env` and use `npx vercel dev`. Opening `dist/index.html` alone only displays the static client, without its API.

## Migration

See [docs/MIGRATION-RU.md](docs/MIGRATION-RU.md). A migration imports the published catalog and progress, not old login cookies. Existing unpublished drafts and original uploads on the previous host are not moved by that snapshot and stay available there until separately transferred.
