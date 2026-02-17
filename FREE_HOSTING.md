# Free hosting: Supabase + Vercel

Host the app for free using **GitHub** + **Vercel** (frontend and API) + **Supabase** (PostgreSQL). One repo, one Vercel project, one database. No Railway or Render.

---

## 1. Get a free PostgreSQL database (Supabase)

1. Go to **[supabase.com](https://supabase.com)** and sign up (free, GitHub login).
2. Create a new project (e.g. "atlantic-pool"); choose a region and database password.
3. In the project: **Project Settings** → **Database** → **Connection string** → **URI**.
4. Copy the connection string (looks like `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).  
   Add `?sslmode=require` if your client expects it. You’ll use this as `DATABASE_URL` in Vercel.

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
   - `DATABASE_URL` = your Supabase connection string (URI from Supabase → Project Settings → Database)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://nhl-atlantic-pool.vercel.app`
5. Deploy. Your app will be at **https://nhl-atlantic-pool.vercel.app**.

**Do not set** `VITE_API_URL` for production. The frontend uses the same origin (`/api`) when that env is unset.

---

## 3. Initialize the database

After the first successful deploy, open in a browser (once):

`https://nhl-atlantic-pool.vercel.app/api/init-db`

That creates the tables in Supabase. Safe to run again (idempotent).

---

## 4. Standings updates (optional)

The API runs as serverless functions, so there is no long-lived process for `node-cron`. You can:

- Update standings manually from the Admin page (if available), or
- Add a Vercel Cron job later (e.g. a serverless function that runs on a schedule and updates standings).

---

## Summary

| Part      | Service  | Purpose                          |
|-----------|----------|-----------------------------------|
| Code      | GitHub   | Single repo (frontend + backend)  |
| Frontend  | Vercel   | Static app (from `frontend/dist`) |
| API       | Vercel   | Serverless under `/api/*`         |
| Database  | Supabase | PostgreSQL, free tier            |

All free. Set `DATABASE_URL` and `FRONTEND_URL` in Vercel, deploy from the repo root, then hit `/api/init-db` once.
