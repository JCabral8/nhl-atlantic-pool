# Atlantic Pool standings site

Single-page Next.js app to track:

- Live-ish NHL Atlantic standings
- Justin / Chris / Nick preseason picks
- Pool scoring (exact rank = 3, off by 1 = 1, off by 2+ = 0)
- Leaderboard totals (max 24)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How data refresh works (foolproof default)

This app fetches standings server-side from:

- `https://api-web.nhle.com/v1/standings/now`

The fetch uses Next.js time-based cache revalidation once per day:

- `revalidate = 86400` seconds

Why this is reliable:

- No browser CORS problems (server-side fetch, not client fetch)
- No cron job required for normal daily updates
- If live fetch fails, app falls back to a built-in snapshot dataset

## Where to edit picks

Player picks and scoring are in:

- `src/lib/pool.ts`

## Optional snapshot JSON workflow

If you want zero runtime API dependency, you can add a manual file:

- `public/standings.snapshot.json`

Then adjust `src/lib/standings.ts` to read that file first (or as fallback). Update it manually and redeploy.

## Vercel deploy

1. Push this project to GitHub.
2. Import repo into Vercel as a Next.js project.
3. Deploy.

No env vars are required for current setup.

## Common pitfalls (and fixes)

- CORS errors: happen when fetching NHL API from the browser. Fix by fetching only on server.
- Cron not firing: often wrong URL, protected endpoint, missing auth, or wrong branch/env target.
- Random stale data confusion: remember revalidate refreshes after cache expiry and next request.
