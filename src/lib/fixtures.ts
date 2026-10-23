import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

/** Read and validate any JSON file relative to the repo root. */
export async function loadJson<S extends z.ZodType>(relPath: string, schema: S): Promise<z.infer<S>> {
  return schema.parse(JSON.parse(await readFile(path.join(process.cwd(), relPath), 'utf8')));
}

/** Load and validate a mock, e.g. loadFixture('portfolio.json', portfolioSchema). */
export const loadFixture = <S extends z.ZodType>(name: string, schema: S) =>
  loadJson(`fixtures/${name}`, schema);
