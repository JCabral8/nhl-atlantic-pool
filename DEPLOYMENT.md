# Deployment Guide for NHL Atlantic Pool

This guide will help you deploy your NHL Atlantic Pool application to production.

## Prerequisites

1. **Git** installed on your computer
2. **GitHub account** (free)
3. **Railway account** (free tier available)
4. **Vercel account** (free tier available)

## Step 1: Set Up Git and GitHub

### 1.1 Initialize Git (if not already done)

Open a terminal in your project folder and run:

```bash
cd "C:\Users\Justin\Atlantic Pool"

# Check if Git is initialized
git status

# If not initialized, run:
git init
```

### 1.2 Create GitHub Repository

1. Go to https://github.com and sign in
2. Click the "+" icon → "New repository"
3. Name it: `nhl-atlantic-pool`
4. Set to **Public** (required for free hosting)
5. **Do NOT** initialize with README
6. Click "Create repository"

### 1.3 Push Your Code to GitHub

```bash
# Add all files
git add .

# Create first commit
git commit -m "Initial commit - NHL Atlantic Pool"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nhl-atlantic-pool.git

# Push to GitHub
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (or Personal Access Token).

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)
4. Authorize Railway to access your repositories

### 2.2 Deploy Backend

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `nhl-atlantic-pool` repository
4. Click "Deploy Now"

### 2.3 Configure Backend Service

1. Click on your deployed service
2. Go to **Settings** tab
3. Set **Root Directory** to: `backend`
4. Railway will automatically detect Node.js and deploy

### 2.4 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create the database and set `DATABASE_URL` environment variable

### 2.5 Set Environment Variables

Go to **Variables** tab and add:

- `PORT` = `3001`
- `NODE_ENV` = `production`
- `FRONTEND_URL` = (leave empty for now, add after frontend is deployed)
- `DATABASE_URL` = (automatically set by Railway, don't change)

### 2.6 Get Your Backend URL

1. Go to **Settings** → **Domains**
2. Railway will generate a domain like: `your-app.railway.app`
3. Copy this URL - you'll need it for the frontend

### 2.7 Initialize Database

After deployment, visit:
```
https://your-backend.railway.app/api/init-db
```

Or use Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
railway run node src/database/init.js
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

### 3.2 Import Project

1. Click **"Add New Project"**
2. Select your `nhl-atlantic-pool` repository
3. Click **"Import"**

### 3.3 Configure Frontend

Set these values:

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Add Environment Variable

In **Environment Variables** section, add:

- **Name**: `VITE_API_URL`
- **Value**: `https://your-backend.railway.app/api` (use your Railway URL)

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Vercel will provide a URL like: `nhl-atlantic-pool.vercel.app`
4. Copy this URL

## Step 4: Connect Frontend and Backend

### 4.1 Update Railway Environment Variable

1. Go back to Railway
2. **Settings** → **Variables**
3. Update `FRONTEND_URL` to your Vercel URL: `https://nhl-atlantic-pool.vercel.app`
4. Railway will automatically redeploy

### 4.2 Update Vercel Environment Variable (if needed)

1. Go to Vercel
2. **Settings** → **Environment Variables**
3. Verify `VITE_API_URL` is correct
4. If you changed it, redeploy

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://nhl-atlantic-pool.vercel.app`
2. Test the application:
   - Select a user
   - Make predictions
   - Check if data persists
3. Check backend health: `https://your-backend.railway.app/health`

## Troubleshooting

### Backend Issues

- **"Cannot connect to database"**: Check that `DATABASE_URL` is set in Railway
- **"CORS error"**: Verify `FRONTEND_URL` matches your Vercel URL exactly
- **"Database not initialized"**: Visit `/api/init-db` endpoint or run init script

### Frontend Issues

- **"Cannot connect to API"**: Check `VITE_API_URL` in Vercel environment variables
- **"Build failed"**: Check Vercel build logs for errors
- **"404 errors"**: Verify the API URL includes `/api` at the end

### Database Issues

- **"Table doesn't exist"**: Run database initialization
- **"Connection timeout"**: Check Railway database is running

## Updating Your Deployment

When you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

Both Railway and Vercel will automatically redeploy when you push to GitHub!

## Cost Estimate

- **Vercel**: Free (hobby plan)
- **Railway**: Free tier (500 hours/month), then ~$5/month
- **Total**: Free to ~$5/month

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check deployment logs in Railway and Vercel dashboards

