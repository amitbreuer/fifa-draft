#!/usr/bin/env node
/**
 * Fetches EA SPORTS FC 27 player ratings and writes them to the draft data files.
 *
 * The public drop-api still serves the previous (FC 25/26) ratings iteration, so this
 * script reads the ratings page instead: page 1 comes from the __NEXT_DATA__ blob
 * embedded in the HTML, and the remaining pages come from the same page's Next.js
 * data endpoint (which requires the build id scraped from that first response).
 *
 * Usage:
 *   node scripts/fetch-fc-2027.mjs [--limit 500] [--gender 0] [--out <path>]
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const RATINGS_URL = 'https://www.ea.com/games/ea-sports-fc/ratings';
const FRANCHISE_SLUG = 'ea-sports-fc';
const PAGE_SIZE = 100;
const ORDER_BY = 'ovr:desc';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const OUTPUT_TARGETS = [
  join(repoRoot, 'projects/server/data/fc-2027.json'),
  join(repoRoot, 'projects/client/src/assets/data/2027.json'),
];

function parseArgs(argv) {
  const args = { limit: 500, gender: 0, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--gender') args.gender = Number(argv[++i]);
    else if (arg === '--out') args.out = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(args.limit) || args.limit <= 0) {
    throw new Error('--limit must be a positive integer');
  }
  if (![0, 1].includes(args.gender)) {
    throw new Error('--gender must be 0 (men) or 1 (women)');
  }
  return args;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      accept: 'text/html,application/json',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`GET ${url} failed with ${res.status}`);
  return res.text();
}

/** Reads the __NEXT_DATA__ payload embedded in the ratings page HTML. */
async function fetchFirstPage(gender) {
  const html = await fetchText(`${RATINGS_URL}?gender=${gender}&orderBy=${encodeURIComponent(ORDER_BY)}`);
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Could not find __NEXT_DATA__ in the ratings page');

  const data = JSON.parse(match[1]);
  const ratingDetails = data?.props?.pageProps?.ratingDetails;
  if (!ratingDetails?.items) throw new Error('Ratings page did not contain any players');

  return { buildId: data.buildId, ratingDetails };
}

/** Pages 2+ come from the Next.js data endpoint backing the same route. */
async function fetchPage(buildId, gender, page) {
  const params = new URLSearchParams({
    gender: String(gender),
    orderBy: ORDER_BY,
    page: String(page),
    franchiseSlug: FRANCHISE_SLUG,
  });
  const url = `https://www.ea.com/_next/data/${buildId}/en/games/${FRANCHISE_SLUG}/ratings.json?${params}`;
  const json = JSON.parse(await fetchText(url));
  const items = json?.pageProps?.ratingDetails?.items;
  if (!items) throw new Error(`Page ${page} did not contain any players`);
  return items;
}

function toPlayer({
  id,
  firstName,
  lastName,
  commonName,
  overallRating,
  skillMoves,
  weakFootAbility,
  preferredFoot,
  position,
  alternatePositions,
  playerAbilities,
  team,
  nationality,
  stats,
  shieldUrl,
}) {
  return {
    id,
    firstName,
    lastName,
    commonName,
    overallRating,
    skillMoves,
    weakFootAbility,
    preferredFoot: preferredFoot === 1 ? 'Right' : 'Left',
    position,
    alternatePositions,
    playerAbilities,
    team,
    nationality,
    stats,
    shieldUrl,
  };
}

async function main() {
  const { limit, gender, out } = parseArgs(process.argv.slice(2));

  const { buildId, ratingDetails } = await fetchFirstPage(gender);
  console.log(`Build id ${buildId}, ${ratingDetails.totalItems} players available`);

  const target = Math.min(limit, ratingDetails.totalItems);
  const byId = new Map();
  const collect = (items) => {
    for (const item of items) {
      if (byId.size >= target) break;
      // The API pages overlap slightly, so de-duplicate as we go.
      if (!byId.has(item.id)) byId.set(item.id, toPlayer(item));
    }
  };

  collect(ratingDetails.items);

  const lastPage = Math.ceil(ratingDetails.totalItems / PAGE_SIZE);
  for (let page = 2; byId.size < target && page <= lastPage; page++) {
    collect(await fetchPage(buildId, gender, page));
    console.log(`Fetched page ${page} — ${byId.size}/${target} players`);
  }

  if (byId.size < target) {
    throw new Error(`Only collected ${byId.size} of ${target} requested players`);
  }

  const players = [...byId.values()].sort((a, b) => b.overallRating - a.overallRating);
  const json = `${JSON.stringify(players, null, 2)}\n`;
  const targets = out ? [resolve(process.cwd(), out)] : OUTPUT_TARGETS;

  for (const file of targets) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, json, 'utf-8');
    console.log(`Wrote ${players.length} players to ${file}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
