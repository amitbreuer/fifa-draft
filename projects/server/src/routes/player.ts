import { Router, Request, Response } from 'express';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const playerRouter = Router();

const dataDir = join(process.cwd(), 'data');
const cache = new Map<string, any>();

// GET /api/players/datasets — list available datasets
playerRouter.get('/datasets', async (_req: Request, res: Response) => {
  try {
    if (!cache.has('_datasets')) {
      const data = await readFile(join(dataDir, 'datasets.json'), 'utf-8');
      cache.set('_datasets', JSON.parse(data));
    }
    res.json(cache.get('_datasets'));
  } catch (err) {
    console.error('Datasets load error:', err);
    res.status(500).json({ error: 'Failed to load datasets' });
  }
});

// GET /api/players/:datasetId — get players for a dataset
playerRouter.get('/:datasetId', async (req: Request, res: Response) => {
  try {
    const datasetId = Array.isArray(req.params.datasetId) ? req.params.datasetId[0] : req.params.datasetId;

    if (!cache.has('_datasets')) {
      const meta = await readFile(join(dataDir, 'datasets.json'), 'utf-8');
      cache.set('_datasets', JSON.parse(meta));
    }

    const datasets = cache.get('_datasets') as { id: string; file: string }[];
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    if (!cache.has(datasetId)) {
      const data = await readFile(join(dataDir, dataset.file), 'utf-8');
      cache.set(datasetId, JSON.parse(data));
    }

    res.json(cache.get(datasetId));
  } catch (err) {
    console.error('Players load error:', err);
    res.status(500).json({ error: 'Failed to load players' });
  }
});
