import { readFile } from 'fs/promises';
import { join } from 'path';

export interface Dataset {
  id: string;
  label: string;
  file: string;
  default: boolean;
}

const dataDir = join(process.cwd(), 'data');

let datasetsPromise: Promise<Dataset[]> | null = null;
const playerCache = new Map<string, unknown>();

export function loadDatasets(): Promise<Dataset[]> {
  if (!datasetsPromise) {
    datasetsPromise = readFile(join(dataDir, 'datasets.json'), 'utf-8')
      .then(raw => JSON.parse(raw) as Dataset[])
      .catch(err => {
        // Don't cache failures, so a transient read error can be retried.
        datasetsPromise = null;
        throw err;
      });
  }
  return datasetsPromise;
}

export async function getDefaultDatasetId(): Promise<string> {
  const datasets = await loadDatasets();
  const fallback = datasets.find(d => d.default) ?? datasets[0];
  if (!fallback) throw new Error('No datasets configured');
  return fallback.id;
}

export async function loadPlayers(datasetId: string): Promise<unknown | null> {
  const datasets = await loadDatasets();
  const dataset = datasets.find(d => d.id === datasetId);
  if (!dataset) return null;

  if (!playerCache.has(datasetId)) {
    const raw = await readFile(join(dataDir, dataset.file), 'utf-8');
    playerCache.set(datasetId, JSON.parse(raw));
  }
  return playerCache.get(datasetId);
}
