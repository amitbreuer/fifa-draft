import { Router, Request, Response } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const playerRouter = Router();

let playersCache: any[] | null = null;

playerRouter.get('/', async (_req: Request, res: Response) => {
  try {
    if (!playersCache) {
      const filePath = join(process.cwd(), '..', 'src', 'assets', 'players.json');
      const data = await readFile(filePath, 'utf-8');
      playersCache = JSON.parse(data);
    }
    res.json(playersCache);
  } catch (err) {
    console.error('Players load error:', err);
    res.status(500).json({ error: 'Failed to load players' });
  }
});
