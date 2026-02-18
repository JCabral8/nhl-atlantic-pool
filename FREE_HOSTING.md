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
   - `CRON_SECRET` = optional; required for automatic standings cron (use a random string 16+ chars).
   - Add these for **Production** and **Preview** (or enable “Apply to Preview”) so preview deployments work.
5. Deploy. Your app will be at **https://nhl-atlantic-pool.vercel.app**.

**Do not set** `VITE_API_URL` for production. The frontend uses the same origin (`/api`) when that env is unset.

---

## 3. Initialize the database

After the first successful deploy, open in a browser (once):

`https://nhl-atlantic-pool.vercel.app/api/init-db`

That creates the tables in Supabase. Safe to run again (idempotent).

---

## 4. Standings updates

- **Manual:** In the app, go to **Admin**, then use the **Update NHL standings** button to fetch the latest Atlantic Division standings from the NHL API and save them to the database.
- **Automatic (optional):** A Vercel Cron job is configured to call `/api/cron/standings` daily (8:00 UTC). Add a **`CRON_SECRET`** environment variable in Vercel (Settings → Environment Variables): use a random string of at least 16 characters. Vercel sends it as a Bearer token when invoking the cron; the endpoint rejects requests without it.

### Setting up automatic standings updates

1. **Set CRON_SECRET:**
   - In Vercel dashboard → Project → Settings → Environment Variables
   - Add `CRON_SECRET` with a random string (at least 16 characters)
   - Example: `openssl rand -hex 16` or use a password generator
   - Apply to **Production** environment (cron only runs on production)

2. **Verify cron configuration:**
   - Visit `https://your-app.vercel.app/api/cron/status` to check if `CRON_SECRET` is configured
   - In Admin page, you'll see cron status and can test the cron job manually

3. **Check cron execution:**
   - Vercel Cron jobs run on Production deployments only
   - Schedule: Daily at 8:00 AM UTC (configured in `vercel.json`)
   - View logs: Vercel Dashboard → Deployments → Functions → `api/cron/standings`
   - Check last update time: Admin page shows "Last updated" timestamp

4. **Troubleshooting cron:**
   - **Cron not running:** Ensure `CRON_SECRET` is set in Production environment (not Preview)
   - **401 Unauthorized:** Verify `CRON_SECRET` matches between Vercel env vars and what the endpoint expects
   - **No logs:** Check Vercel Functions logs under Deployments tab
   - **Test manually:** Use "Test Cron Job" button in Admin page to verify the endpoint works
   - **Check last updated:** Use "Refresh Status" button or visit `/api/standings/last-updated`

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
