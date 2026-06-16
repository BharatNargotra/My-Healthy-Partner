# My Health Partner 🏃

AI-powered personal health tracking app. Built with the MERN stack + GPT-4o mini.

## Features

- **Daily Log** — meals, exercises, water, mood, sleep
- **AI Meal Analyzer** — type any food name → AI fills calories & macros instantly
- **AI Exercise Calories** — estimates calories burned based on exercise + user weight  
- **AI Calorie Targets** — personalized daily calorie & macro goals from your profile  
- **AI Daily Insight** — motivational coaching message based on today's log
- **Progress Charts** — weight trend, calories in/out, sleep, macros, mood radar, weekly breakdown
- **Activity Calendar** — visual heatmap of workout & meal days

## Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 19, Vite, Recharts, react-router v7 |
| Backend  | Node.js, Express 5, MongoDB, Mongoose     |
| Auth     | JWT (bcrypt, 12 rounds)                   |
| AI       | OpenAI GPT-4o mini (efficient, low cost)  |
| Security | Helmet, CORS, rate limiting               |

## Quick Start

### 1. Clone & install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

Copy `.env` at the root and fill in your values:

```env
MONGO_URI=mongodb://localhost:27017/my-health-partner
JWT_SECRET=your_long_random_secret_here
OPENAI_API_KEY=sk-your-key-here
```

> ⚠️ **Never commit `.env` to git.** It's already in `.gitignore`.

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

## Production Deployment

```bash
cd frontend && npm run build
# Serve /frontend/dist with nginx or your preferred static host
# Point ALLOWED_ORIGINS on the backend to your frontend domain
```

## AI Token Usage (budget-conscious)

| Feature             | Max tokens | Frequency              |
|---------------------|------------|------------------------|
| Calorie Targets     | 200        | Once/day, cached 24h   |
| Meal Macro Analysis | 80         | On demand              |
| Exercise Calories   | 40         | On demand              |
| Daily Insight       | 120        | Once after first log   |

All AI responses use **gpt-4o-mini** at low temperature for consistent, affordable results.

## Project Structure

```
health-partner/
├── .env                  ← single root .env (never commit)
├── .gitignore
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/           ← User, DailyLog, Goal
│   ├── routes/           ← auth, users, logs, progress, ai
│   ├── services/openai.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/   ← Navbar, CalendarView, PrivateRoute
        ├── context/      ← AuthContext
        ├── pages/        ← Login, Register, Profile, DailyLog, Progress
        └── services/api.js
```
