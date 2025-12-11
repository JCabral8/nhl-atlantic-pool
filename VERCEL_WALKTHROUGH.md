# ▲ Complete Vercel Setup Walkthrough

This is a **beginner-friendly, step-by-step guide** to deploy your frontend on Vercel.

## 📋 What You'll Need

- A GitHub account (you have: JCabral8)
- Your code pushed to GitHub (✅ already done)
- Your Railway backend URL (from the Railway walkthrough)
- About 10 minutes

---

## Step 1: Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. You'll see the Vercel dashboard

---

## Step 2: Import Your Project

1. In Vercel dashboard, click the big **"Add New Project"** button (top right)
2. You'll see a list of your GitHub repositories
3. Find and click **"nhl-atlantic-pool"**
4. Click **"Import"** button

---

## Step 3: Configure Your Project

Vercel will try to auto-detect your settings, but you need to configure them:

1. **Framework Preset**: Select **"Vite"** from the dropdown
   - (If you don't see it, click "Other" and we'll configure manually)

2. **Root Directory**: Click **"Edit"** next to Root Directory
   - Type: `frontend`
   - Click "Continue"

3. **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (should be auto-filled)

**Why?** Your frontend code is in the `frontend` folder, not the root folder.

---

## Step 4: Add Environment Variable

This connects your frontend to your Railway backend:

1. Scroll down to **"Environment Variables"** section
2. Click **"+ Add"** button
3. Add this variable:

   **Variable:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://YOUR-RAILWAY-URL.railway.app/api`
     - Replace `YOUR-RAILWAY-URL` with your actual Railway URL
     - Example: `https://nhl-atlantic-pool-production-xxxx.up.railway.app/api`
     - **Important:** Make sure to include `/api` at the end!
   - **Environment**: Select all three (Production, Preview, Development)
   - Click **"Save"**

**Where to find your Railway URL:**
- Go to your Railway project
- Click on your service
- Go to **Settings** → **Domains**
- Copy the URL (it looks like: `https://nhl-atlantic-pool-production-xxxx.up.railway.app`)

---

## Step 5: Deploy

1. Scroll down and click the big **"Deploy"** button
2. Vercel will start building your project
3. You'll see a progress screen with build logs
4. Wait for it to finish (usually 1-2 minutes)

---

## Step 6: Get Your Frontend URL

Once deployment completes:

1. You'll see a **"Congratulations"** message
2. Your app will be live at a URL like: `https://nhl-atlantic-pool.vercel.app`
3. **Copy this URL** - you'll need it!

You can also find it later:
- Go to your project dashboard
- The URL is shown at the top of the page

---

## Step 7: Update Railway with Your Frontend URL

Now you need to tell your backend where the frontend is:

1. Go back to **Railway** (in a new tab)
2. Click on your backend service
3. Go to **"Variables"** tab
4. Find the `FRONTEND_URL` variable
5. Click the **pencil icon** (edit) next to it
6. Update the value to your Vercel URL: `https://nhl-atlantic-pool.vercel.app`
   - (Use your actual Vercel URL, not this example)
7. Click **"Save"**
8. Railway will automatically redeploy (this takes about 1-2 minutes)

**Why?** This allows your backend to accept requests from your frontend (CORS).

---

## Step 8: Test Your App

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. You should see your NHL Pool app!
3. Try selecting a user
4. Try making predictions
5. Check if everything works

---

## 🐛 Troubleshooting

### Problem: "Build failed" or "Build error"

**Solution:**
- Check the build logs in Vercel (click on the failed deployment)
- Common issues:
  - **TypeScript errors**: Check that all TypeScript files compile
  - **Missing dependencies**: Make sure `package.json` has all required packages
  - **Build command wrong**: Should be `npm run build`

### Problem: "Cannot connect to API" or "Network error"

**Solution:**
- Check that `VITE_API_URL` is set correctly in Vercel
- Make sure it includes `/api` at the end
- Verify your Railway backend is running (visit `/health` endpoint)
- Check browser console (F12) for specific error messages

### Problem: "CORS error" in browser console

**Solution:**
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check that Railway has redeployed after updating `FRONTEND_URL`
- The URLs must match exactly (including `https://`)

### Problem: "404 Not Found" when navigating

**Solution:**
- This is normal for React Router apps on Vercel
- Vercel needs a special configuration file
- See "Fix 404 Errors" section below

### Problem: Environment variable not working

**Solution:**
- Make sure the variable name is exactly `VITE_API_URL` (case-sensitive)
- Vite requires the `VITE_` prefix for environment variables
- After adding/changing variables, Vercel will redeploy automatically
- Make sure you selected all environments (Production, Preview, Development)

---

## 🔧 Fix 404 Errors (React Router)

If you get 404 errors when navigating to routes like `/predict/nick`:

1. In your Vercel project dashboard, go to **Settings**
2. Click **"Functions"** in the left sidebar
3. You should see a `vercel.json` file (if not, create it - see below)
4. If it doesn't exist, create a file called `vercel.json` in your **frontend** folder:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

5. Commit and push this file to GitHub
6. Vercel will automatically redeploy

**Why?** React Router handles routing in the browser, but Vercel needs to know to serve `index.html` for all routes.

---

## ✅ What Should Happen

When everything works:
1. Vercel builds your app successfully (you see "Build successful")
2. Your app is live at a Vercel URL
3. You can visit the URL and see your app
4. You can select users and make predictions
5. Data persists (saved to Railway backend)

---

## 🎯 Next Steps

Once your frontend is working:
1. **Test everything thoroughly** - make predictions, check standings
2. **Share your app** - send the Vercel URL to your friends!
3. **Customize your domain** (optional):
   - In Vercel project → Settings → Domains
   - You can add a custom domain like `nhlpool.com`

---

## 💡 Tips

- **Vercel auto-deploys** when you push to GitHub - no need to manually redeploy
- **Preview deployments** - Every pull request gets its own preview URL automatically
- **Free tier** is very generous - includes unlimited deployments
- **Build logs** are available for each deployment - check them if something breaks
- **Environment variables** can be different for Production vs Preview

---

## 🔄 Making Updates

When you make changes to your frontend:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy the new version
4. Update your live site

---

## 🆘 Still Stuck?

If you're still having issues:

1. **Check Vercel build logs**:
   - Go to your project → Deployments tab
   - Click on the latest deployment
   - Scroll through the logs to find errors

2. **Check browser console**:
   - Open your app in browser
   - Press F12 to open developer tools
   - Look at the Console tab for errors
   - Look at the Network tab to see if API calls are failing

3. **Verify environment variables**:
   - Go to Settings → Environment Variables
   - Make sure `VITE_API_URL` is set correctly
   - Make sure it includes `/api` at the end

4. **Test your backend separately**:
   - Visit `https://your-railway-url.railway.app/health`
   - Should return `{"status":"OK"}`
   - Visit `https://your-railway-url.railway.app/api/users`
   - Should return a list of users

---

## 📝 Quick Checklist

Before you finish, make sure:

- [ ] Frontend is deployed on Vercel
- [ ] `VITE_API_URL` environment variable is set correctly
- [ ] Railway `FRONTEND_URL` is updated with your Vercel URL
- [ ] You can visit your Vercel URL and see the app
- [ ] You can select a user
- [ ] You can make predictions
- [ ] Predictions are saved (refresh and they're still there)

---

## 🎉 You're Done!

Your NHL Atlantic Pool app is now live on the internet! 

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

Both will automatically update when you push code to GitHub!

