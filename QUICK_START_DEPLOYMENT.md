# Quick Start: Deploy Your NHL Pool App

Follow these steps to get your app live on the internet!

## 🚀 Step-by-Step Guide

### 1. Push to GitHub (5 minutes)

**If you don't have Git set up:**
```bash
# Install Git from: https://git-scm.com/download/win
# Then configure:
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Push your code:**
```bash
cd "C:\Users\Justin\Atlantic Pool"

# Initialize Git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nhl-atlantic-pool.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend to Railway (10 minutes)

1. **Sign up**: Go to https://railway.app → Sign up with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repo**: Choose `nhl-atlantic-pool`
4. **Configure**:
   - Settings → Root Directory: `backend`
   - Railway auto-detects Node.js
5. **Add Database**:
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway sets `DATABASE_URL` automatically
6. **Set Variables**:
   - `PORT` = `3001`
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (leave empty, add after frontend deploys)
7. **Get URL**: Settings → Domains → Copy your Railway URL

### 3. Initialize Database

After Railway deploys, visit:
```
https://your-app.railway.app/api/init-db
```

Or use Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
railway run node src/database/init.js
```

### 4. Deploy Frontend to Vercel (5 minutes)

1. **Sign up**: Go to https://vercel.com → Sign up with GitHub
2. **Import**: Click "Add New Project" → Select your repo
3. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output: `dist`
4. **Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app/api`
5. **Deploy**: Click "Deploy"
6. **Get URL**: Copy your Vercel URL

### 5. Connect Frontend & Backend

1. **Railway**: Settings → Variables → Update `FRONTEND_URL` = your Vercel URL
2. **Wait**: Railway redeploys automatically
3. **Test**: Visit your Vercel URL!

## ✅ You're Done!

Your app is now live at: `https://your-app.vercel.app`

## 🔄 Making Updates

When you make changes:
```bash
git add .
git commit -m "Your changes"
git push
```

Both Railway and Vercel auto-deploy on push!

## 🆘 Troubleshooting

- **Backend not working?** Check Railway logs
- **Frontend can't connect?** Verify `VITE_API_URL` in Vercel
- **Database errors?** Make sure you ran `/api/init-db`
- **CORS errors?** Check `FRONTEND_URL` in Railway matches Vercel URL exactly

## 📚 Full Guide

See `DEPLOYMENT.md` for detailed instructions.

