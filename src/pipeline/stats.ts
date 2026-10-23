import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export type CacheStats = { companies: number; researched: number; incidents: number; sources: number };

async function compute(): Promise<CacheStats | null> {
  const root = process.cwd();
  const universe = JSON.parse(await readFile(path.join(root, 'data/universe.json'), 'utf8')) as unknown[];
  const files = (await readdir(path.join(root, 'data/ethics'))).filter((f) => f.endsWith('.json'));
  let incidents = 0;
  let sources = 0;
  for (const f of files) {
    const rec = JSON.parse(await readFile(path.join(root, 'data/ethics', f), 'utf8')) as {
      causes?: Record<string, { incidents?: { sources?: unknown[] }[] }>;
    };
    for (const c of Object.values(rec.causes ?? {})) {
      for (const i of c.incidents ?? []) {
        incidents++;
        sources += i.sources?.length ?? 0;
      }
    }
  }
  return { companies: universe.length, researched: files.length, incidents, sources };
}

let cached: Promise<CacheStats | null> | undefined;

/** Real numbers for the landing page, read from the data files. Null if the data is not there. */
export const cacheStats = () => (cached ??= compute().catch(() => null));
