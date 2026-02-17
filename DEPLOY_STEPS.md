# What you need to do – Supabase + Vercel (step-by-step)

Do these in order. The codebase is already set up; this is your checklist.

---

## 1. Push the latest code to GitHub

From your project folder in a terminal:

```bash
git add .
git status
git commit -m "Vercel + Supabase: root package.json, api, vercel.json, lockfile"
git push origin main
```

(If something is already committed elsewhere, just make sure `package.json`, `package-lock.json`, `vercel.json`, and the `api/` folder at the repo root are in the repo and pushed.)

---

## 2. Supabase – get your connection string

1. Go to **[supabase.com](https://supabase.com)** and sign in.
2. Open your project (or create one, e.g. “atlantic-pool”).
3. **Project Settings** (gear) → **Database**.
4. Under **Connection string**, choose **URI**.
5. Copy the string (looks like `postgresql://postgres.[ref]:[YOUR-PASSWORD]@...pooler.supabase.com:6543/postgres`).
6. If the password has special characters, replace them in the string with the correct URL-encoded values, or use “Use connection pooling” and copy the **Session** or **Transaction** URI.
7. Keep this for step 4.

---

## 3. Vercel – point the project at the repo root

1. Go to **[vercel.com](https://vercel.com)** and open the **nhl-atlantic-pool** project.
2. **Settings** → **General**.
3. **Root Directory:** leave **blank** (so the whole repo is used).
4. Under **Build & Development Settings**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** leave default, or set `npm install --ignore-scripts` (same as in `vercel.json`).
5. Save if there’s a Save option.

---

## 4. Vercel – add environment variables

1. In the same project: **Settings** → **Environment Variables**.
2. Add these (for **Production**; add for Preview too if you use it):

| Name           | Value                                              |
|----------------|----------------------------------------------------|
| `DATABASE_URL` | *(paste the full Supabase URI from step 2)*       |
| `NODE_ENV`     | `production`                                       |
| `FRONTEND_URL` | `https://nhl-atlantic-pool.vercel.app`             |

3. Do **not** set `VITE_API_URL` for production.
4. Save each variable.

---

## 5. Trigger a new deploy

1. Go to the **Deployments** tab.
2. Either:
   - Push a new commit to `main` (if you did step 1), and wait for the automatic deploy, or  
   - Open the latest deployment → **⋯** → **Redeploy** → **Redeploy** (optionally enable “Use existing Build Cache” off for a clean build).
3. Wait until the deployment status is **Ready**.

---

## 6. Create the database tables (one time)

1. When the deploy is **Ready**, open in your browser:
   - **https://nhl-atlantic-pool.vercel.app/api/init-db**
2. You should see a JSON response like `{"success":true,"message":"Database initialized successfully"}`.
3. You only need to do this once (safe to run again).

---

## 7. Use the app

1. Open **https://nhl-atlantic-pool.vercel.app**
2. The app should load and use the API on the same domain (`/api`). Users, standings, and admin should work.

---

## If the build fails

- **Deployments** → click the failed deployment → **Building** / **Build Logs**.
- If it fails at **install**: the repo should have a root `package-lock.json`; if not, run `npm install` in the project root and commit and push `package.json` + `package-lock.json`.
- If it fails at **build**: check the red error line in the log (e.g. missing file or wrong path) and fix in code, then push again.

---

## Quick checklist

- [ ] Code pushed to GitHub (root `package.json`, `vercel.json`, `api/`, `package-lock.json`)
- [ ] Vercel Root Directory is **blank**
- [ ] Vercel Build Command = `npm run build`, Output = `frontend/dist`
- [ ] `DATABASE_URL`, `NODE_ENV`, `FRONTEND_URL` set in Vercel
- [ ] New deployment run and **Ready**
- [ ] Visited **https://nhl-atlantic-pool.vercel.app/api/init-db** once
- [ ] Opened **https://nhl-atlantic-pool.vercel.app** and confirmed the app works
