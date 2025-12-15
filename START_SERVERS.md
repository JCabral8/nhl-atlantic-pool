# How to Start the NHL Pool Application

## Quick Start Guide

### Option 1: Using PowerShell (Recommended for Windows)

Open PowerShell and run these commands:

```powershell
# Start Backend Server (in a new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Justin\Atlantic Pool\backend'; npm run dev"

# Start Frontend Server (in a new window)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Justin\Atlantic Pool\frontend'; npm run dev"
```

### Option 2: Using Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd "C:\Users\Justin\Atlantic Pool\backend"
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "C:\Users\Justin\Atlantic Pool\frontend"
npm run dev
```

## Access the Application

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Stopping the Servers

Press `Ctrl+C` in each terminal window to stop the servers.

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```powershell
# Stop all node processes
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Then restart the servers
```

### Database Issues

If you need to reset the database:

```bash
cd backend
npm run init-db
```

### Frontend Build Issues

If the frontend won't start:

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

## First Time Setup

If this is your first time running the application:

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   npm run init-db
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start Both Servers** (see Quick Start above)

## Environment Variables

The application uses these default settings:

**Backend (.env):**
- PORT=3001
- FRONTEND_URL=http://localhost:5173
- DEADLINE=2025-12-17T23:59:59-05:00
- DATABASE_PATH=./database/nhl_pool.db

**Frontend:**
- VITE_API_URL=http://localhost:3001/api

## Verifying Everything Works

1. Backend is running: Visit http://localhost:3001/health
2. Frontend is running: Visit http://localhost:5173
3. API is working: Visit http://localhost:3001/api/users

You should see:
- Health check returns `{"status":"OK"}`
- Frontend shows the home page with 3 user avatars
- Users API returns Nick, Justin, and Chris

## Need Help?

Check the console output in both terminal windows for error messages. Most issues are related to:
- Ports already in use
- Missing dependencies (run `npm install`)
- Database not initialized (run `npm run init-db` in backend)

