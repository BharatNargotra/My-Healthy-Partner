import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';
import progressRoutes from './routes/progress.js';
import aiRoutes from './routes/ai.js';

// ── Validate required env vars before anything else ──────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'OPENAI_API_KEY'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var: ${key}`);
    process.exit(1);
  }
});

connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173'
)
  .split(',')
  .map(origin => origin.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Global rate limiter ───────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
);

// ── Auth-specific stricter limiter ────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later.' },
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);

// ── Root Route ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'My Healthy Partner API',
    version: '1.0.0',
  });
});

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// ── Global error handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
