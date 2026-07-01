import './env.js';
import express from 'express';
import cors from 'cors';
import { draftRouter } from './routes/draft.js';
import { playerRouter } from './routes/player.js';
import { botRouter } from './routes/bot.js';
import { db } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: in production, restrict to the deployed client origin (FRONTEND_URL).
// In development, allow any origin for convenience.
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.warn('⚠️  FRONTEND_URL not set — cross-origin requests will be blocked in production');
}
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL ?? false)
    : (process.env.FRONTEND_URL || '*');

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/drafts', draftRouter);
app.use('/api/players', playerRouter);
app.use('/bot/webhook', botRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };
