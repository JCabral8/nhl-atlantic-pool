# NHL Atlantic Conference Prediction Pool

A web application for predicting the final standings of the NHL Atlantic Conference. Users can make predictions, customize their avatars, and compete to see who has the most accurate predictions!

## Features

- 🏒 **Team Predictions**: Drag and drop teams to predict final standings
- 👤 **User Avatars**: Customize your avatar with hair styles, colors, and facial expressions
- ⏰ **Deadline Tracking**: Real-time countdown to the prediction deadline
- 📊 **Current Standings**: View live NHL standings
- 💾 **Persistent Storage**: All predictions are saved and persist across sessions
- 📱 **Mobile Friendly**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React + Vite + Material-UI
- **Backend**: Node.js + Express
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Vercel (frontend) + Railway (backend)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nhl-atlantic-pool.git
   cd nhl-atlantic-pool
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:3001

5. **Install frontend dependencies** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ```

6. **Start the frontend server**
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions, or [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) for a quick guide.

## Project Structure

```
nhl-atlantic-pool/
├── backend/
│   ├── database/          # Database schema and files
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── server.js      # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id/avatar` - Get user avatar preferences
- `PUT /api/users/:id/avatar` - Update user avatar preferences
- `GET /api/standings` - Get current NHL standings
- `GET /api/predictions/:userId` - Get user's predictions
- `POST /api/predictions/:userId` - Save user's predictions
- `GET /api/deadline` - Get deadline information
- `POST /api/init-db` - Initialize database (production)

## Contributing

This is a personal project, but feel free to fork and modify for your own use!

## License

ISC
