# Run backend locally (Windows)

The backend needs a database. On Windows, the SQLite driver often won’t build without Visual Studio, so use PostgreSQL instead.

## 1. Get your Postgres URL from Railway

1. Open your **Railway** project.
2. Click your **PostgreSQL** service.
3. Open the **Connect** (or **Variables**) tab.
4. Copy the **Postgres connection URL** (starts with `postgresql://`).

## 2. Add it to `backend/.env`

Open `backend/.env` and add a line (use your real URL):

```
DATABASE_URL=postgresql://user:password@host:port/railway
```

Your file should look like:

```
PORT=3002
DATABASE_URL=postgresql://...
```

## 3. Start the backend

From the project root:

```powershell
cd backend
npm run dev
```

You should see: `Connected to PostgreSQL` and `Backend server running on http://localhost:3002`.

Then open the app at **http://localhost:5174** (frontend).
