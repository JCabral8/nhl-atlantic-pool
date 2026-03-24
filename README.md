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

## How data refresh works (8:00 AM ET daily)

This app uses a snapshot-first approach:

- Primary: `public/standings.snapshot.json` (updated by GitHub Actions)
- Fallback: live fetch from `https://api-web.nhle.com/v1/standings/now`
- Final fallback: built-in seed snapshot in `src/lib/standings.ts`

Scheduled updates are driven by:

- `.github/workflows/standings-refresh.yml`
- Runs hourly but only proceeds when ET hour is `08` (handles DST via `America/New_York`)
- You can also trigger it manually with **Run workflow** in GitHub Actions

Why this is reliable:

- No browser CORS problems (server-side fetch, not client fetch)
- Exact daily clock target in ET for publishing updates
- Snapshot is committed to `main`, which triggers a Vercel deploy

## Where to edit picks

Player picks and scoring are in:

- `src/lib/pool.ts`

## Snapshot workflow details

Snapshot file path:

- `public/standings.snapshot.json`

Local updater script:

- `node scripts/update-standings-snapshot.mjs`

GitHub Actions uses that script to rewrite the file and commit only when data changed.

## Vercel deploy

1. Push this project to GitHub.
2. Import repo into Vercel (or connect the existing project).
3. **Project Settings → General → Build & Development Settings**
   - **Framework Preset:** Next.js (default).
   - **Root Directory:** leave empty if `package.json` is at the repo root.
   - **Output Directory:** leave **empty**. Do **not** use `dist` or `out` — that was for older static setups. Next.js deploys from `.next` automatically; if you see “No Output Directory named dist”, clear this field and save.
4. Deploy.

No env vars are required for current setup.

This repo includes [`vercel.json`](vercel.json) to pin the Next.js framework and build commands.

## Common pitfalls (and fixes)

- CORS errors: happen when fetching NHL API from the browser. Fix by fetching only on server.
- GitHub Actions scheduler not updating: confirm Actions are enabled for the repo and check `standings-refresh.yml` run logs.
- Random stale data confusion: remember revalidate refreshes after cache expiry and next request.
