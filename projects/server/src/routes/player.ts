import { Router, Request, Response } from 'express';
import { loadDatasets, loadPlayers } from '../services/datasets.js';

export const playerRouter = Router();

// GET /api/players/datasets — list available datasets
playerRouter.get('/datasets', async (_req: Request, res: Response) => {
  try {
    res.json(await loadDatasets());
  } catch (err) {
    console.error('Datasets load error:', err);
    res.status(500).json({ error: 'Failed to load datasets' });
  }
});

// GET /api/players/:datasetId — get players for a dataset
playerRouter.get('/:datasetId', async (req: Request, res: Response) => {
  try {
    const datasetId = Array.isArray(req.params.datasetId) ? req.params.datasetId[0] : req.params.datasetId;
    const players = await loadPlayers(datasetId);

    if (!players) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    res.json(players);
  } catch (err) {
    console.error('Players load error:', err);
    res.status(500).json({ error: 'Failed to load players' });
  }
});
