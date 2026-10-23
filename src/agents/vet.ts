import { NotImplementedError } from '@/lib/not-implemented';
import type { ClientProfile, VetResult } from '@/lib/schemas';

/** Agent (c): stage 2 ethical vetting from data/ethics cache + rubric. Owner: orchestration. */
export async function runVet(_profile: ClientProfile, _tickers: string[]): Promise<VetResult> {
  throw new NotImplementedError('vet agent');
}
