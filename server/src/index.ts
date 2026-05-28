import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { draftRouter } from './routes/draft.js';
import { playerRouter } from './routes/player.js';
import { botRouter } from './routes/bot.js';
import { db } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
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
