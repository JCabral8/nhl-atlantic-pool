# 🚂 Complete Railway Setup Walkthrough

This is a **beginner-friendly, step-by-step guide** to deploy your backend on Railway.

## 📋 What You'll Need

- A GitHub account (you have: JCabral8)
- Your code pushed to GitHub (✅ already done)
- About 15 minutes

---

## Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. You'll see the Railway dashboard

---

## Step 2: Create a New Project

1. In Railway dashboard, click the big **"+ New Project"** button (top right)
2. You'll see options:
   - **"Deploy from GitHub repo"** ← Click this one!
   - "Empty Project"
   - "Deploy a Template"
3. Railway will show your GitHub repositories
4. Find and click **"nhl-atlantic-pool"**
5. Railway will start importing your repo

---

## Step 3: Configure the Service

After Railway imports your repo, you need to tell it where your backend code is:

1. You should see your project with a service (probably called "nhl-atlantic-pool")
2. Click on that service to open it
3. Click the **"Settings"** tab (top of the page)
4. Scroll down to **"Root Directory"**
5. In the text box, type: `backend`
6. Click **"Save"** or press Enter

**Why?** Your backend code is in the `backend` folder, not the root folder.

---

## Step 4: Add a PostgreSQL Database

Your app needs a database. Railway can create one for you:

1. In your Railway project dashboard, click **"+ New"** button
2. A dropdown menu appears
3. Click **"Database"**
4. Click **"Add PostgreSQL"**
5. Railway will create a PostgreSQL database
6. **Important:** Railway automatically sets a `DATABASE_URL` environment variable - you don't need to do anything else!

---

## Step 5: Set Environment Variables

Your app needs some configuration:

1. Go back to your **service** (not the database, the main service)
2. Click the **"Variables"** tab
3. Click **"+ New Variable"** button
4. Add these variables one by one:

   **Variable 1:**
   - Name: `PORT`
   - Value: `3001`
   - Click "Add"

   **Variable 2:**
   - Name: `NODE_ENV`
   - Value: `production`
   - Click "Add"

   **Variable 3:**
   - Name: `FRONTEND_URL`
   - Value: (leave this empty for now - we'll add it after deploying the frontend)
   - Click "Add"

---

## Step 6: Deploy and Get Your URL

1. Railway should automatically start deploying when you configured everything
2. If not, click **"Deploy"** or **"Redeploy"** button
3. Watch the **"Deployments"** tab - you'll see logs of the build process
4. Wait for it to finish (usually 2-3 minutes)
5. Once it says "Deployed" or shows a green checkmark:
   - Go to **"Settings"** tab
   - Scroll to **"Domains"** section
   - You'll see a URL like: `https://nhl-atlantic-pool-production-xxxx.up.railway.app`
   - **Copy this URL** - you'll need it!

---

## Step 7: Initialize the Database

Your database is empty. You need to create the tables:

1. Open a new browser tab
2. Go to: `https://YOUR-RAILWAY-URL.railway.app/api/init-db`
   (Replace `YOUR-RAILWAY-URL` with the URL you copied)
3. You should see: `{"success":true,"message":"Database initialized successfully"}`
4. If you see an error, check the Railway logs (Deployments tab)

---

## Step 8: Test Your Backend

1. Visit: `https://YOUR-RAILWAY-URL.railway.app/health`
2. You should see: `{"status":"OK","timestamp":"..."}`
3. If this works, your backend is live! 🎉

---

## 🐛 Troubleshooting

### Problem: "Script start.sh not found" or "Could not determine how to build"

**Solution:**
- Make sure **Root Directory** is set to `backend` in Settings
- Railway should auto-detect Node.js - if not, try clicking "Redeploy"

### Problem: Build fails with "npm install" errors

**Solution:**
- Check the Deployments tab → View logs
- Look for specific error messages
- Common issues:
  - Missing dependencies (shouldn't happen, but check)
  - Node version mismatch (we set it to Node 18)

### Problem: "Cannot connect to database"

**Solution:**
- Make sure you added the PostgreSQL database
- Check that `DATABASE_URL` is in your Variables (Railway adds it automatically)
- Make sure you ran `/api/init-db` to create tables

### Problem: Service won't start

**Solution:**
- Check the Deployments tab → View logs
- Look for error messages
- Common issues:
  - Port conflict (shouldn't happen with PORT=3001)
  - Missing environment variables

### Problem: "404 Not Found" when visiting URLs

**Solution:**
- Make sure the service is actually deployed (green checkmark)
- Check that you're using the correct Railway URL
- Try the `/health` endpoint first

---

## ✅ What Should Happen

When everything works:
1. Railway builds your app (you see "Build successful" in logs)
2. Railway starts your app (you see "Deployed" status)
3. Visiting `/health` returns `{"status":"OK"}`
4. Visiting `/api/init-db` creates your database tables
5. Your backend is ready to connect to your frontend!

---

## 🎯 Next Steps

Once your backend is working:
1. **Copy your Railway URL** (from Settings → Domains)
2. **Deploy your frontend to Vercel** (see `QUICK_START_DEPLOYMENT.md`)
3. **Come back to Railway** and update `FRONTEND_URL` with your Vercel URL
4. **Redeploy** Railway (it will auto-redeploy when you change variables)

---

## 💡 Tips

- **Railway auto-deploys** when you push to GitHub - no need to manually redeploy
- **Check logs** in the Deployments tab if something goes wrong
- **Free tier** gives you $5/month credit - more than enough for this app
- **Database is persistent** - your data won't disappear

---

## 🆘 Still Stuck?

If you're still having issues:
1. Take a screenshot of the Railway dashboard
2. Check the Deployments tab → View logs → Copy any error messages
3. Share what you see and I can help troubleshoot!

