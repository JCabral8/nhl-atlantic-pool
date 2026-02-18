# Free hosting: Supabase + Vercel

Host the app for free using **GitHub** + **Vercel** (frontend and API) + **Supabase** (PostgreSQL). One repo, one Vercel project, one database. No Railway or Render.

---

## 1. Get a free PostgreSQL database (Supabase)

1. Go to **[supabase.com](https://supabase.com)** and sign up (free, GitHub login).
2. Create a new project (e.g. "atlantic-pool"); choose a region and database password.
3. In the project dashboard, click the **Connect** button (top of the page). If you don’t see it: open the left sidebar → **Database** (or **Project Settings** → **Database**), then look for **Connection string** or **Connect**.
4. In the connection options, choose **Transaction** (pooler) mode — **not Direct**. Use the URI with port **6543** (required for Vercel serverless).
5. Copy the URI and **replace `[YOUR-PASSWORD]`** with your real database password (no brackets). Use this as `DATABASE_URL` in Vercel.

**Note:** Free projects can be paused after inactivity; unpause in the dashboard. No charges.

---

## 2. Deploy on Vercel (frontend + API)

1. Go to **[vercel.com](https://vercel.com)** and sign up / log in with GitHub.
2. **Add New** → **Project** → import the repo that contains this app.
3. Configure the project:
   - **Root Directory:** leave **blank** (Vercel uses repo root).
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install --ignore-scripts` (or leave default; this is set in `vercel.json`)
4. **Environment variables** (Project → Settings → Environment Variables):
   - `DATABASE_URL` = your Supabase connection string (Transaction/pooler URI, port 6543)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://nhl-atlantic-pool.vercel.app`
   - `CRON_SECRET` = optional (cron does not update standings; use Admin button to update).
   - Add these for **Production** and **Preview** (or enable “Apply to Preview”) so preview deployments work.
5. Deploy. Your app will be at **https://nhl-atlantic-pool.vercel.app**.

**Do not set** `VITE_API_URL` for production. The frontend uses the same origin (`/api`) when that env is unset.

---

## 3. Initialize the database

After the first successful deploy, open in a browser (once):

`https://nhl-atlantic-pool.vercel.app/api/init-db`

That creates the tables in Supabase. Safe to run again (idempotent).

---

## 4. Standings updates (automatic via GitHub Actions)

Standings are updated automatically by a **GitHub Actions** workflow that runs daily (and can be run manually). GitHub’s runners can reach the NHL API; they fetch the data and POST it to your app.

**One-time setup:**

1. **Create a secret** (e.g. 32 random characters). You can run: `openssl rand -hex 16` or use a password generator.

2. **In Vercel** (Project → Settings → Environment Variables):
   - Add **`STANDINGS_INGEST_SECRET`** = that same secret. Apply to **Production**.

3. **In GitHub** (repo → Settings → Secrets and variables → Actions):
   - Add **Repository secret**: **`STANDINGS_INGEST_SECRET`** = the same value as in Vercel.
   - Optional: add **Repository variable** **`STANDINGS_INGEST_URL`** = `https://your-app.vercel.app` if your app URL is different from `https://nhl-atlantic-pool.vercel.app`.

4. **Redeploy** the Vercel app once so it picks up `STANDINGS_INGEST_SECRET`.

After that, the workflow **Update NHL Standings** runs daily at 12:00 UTC. To run it now: GitHub repo → **Actions** → **Update NHL Standings** → **Run workflow**.

- **Manual fallback:** Admin page → **Update NHL standings** (or use the manual standings form if auto-fetch fails).

---

## Summary

| Part      | Service  | Purpose                          |
|-----------|----------|-----------------------------------|
| Code      | GitHub   | Single repo (frontend + backend)  |
| Frontend  | Vercel   | Static app (from `frontend/dist`) |
| API       | Vercel   | Serverless under `/api/*`         |
| Database  | Supabase | PostgreSQL, free tier            |

All free. Set `DATABASE_URL` and `FRONTEND_URL` in Vercel, deploy from the repo root, then hit `/api/init-db` once.

---

## Not working?

1. **Check env:** Open `https://your-app.vercel.app/api/status`. You should see `"databaseConfigured": true`. If it’s `false`, add `DATABASE_URL` in Vercel (Settings → Environment Variables, **Production**), then **Redeploy** (env vars apply to new builds only).
2. **Password:** In the Supabase URI, replace `[YOUR-PASSWORD]` with your actual password—no `[]`. Special characters in the password must be URL-encoded (e.g. `@` → `%40`).
3. **Init DB:** After a successful deploy, open `https://your-app.vercel.app/api/init-db` once. You should see `{"success":true,...}`. If you see an error, check Vercel’s **Deployments → Logs** for the failure.
4. **Supabase paused:** Free projects can pause; in Supabase dashboard, resume the project if needed.
