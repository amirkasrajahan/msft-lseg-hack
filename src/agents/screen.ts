import { NotImplementedError } from '@/lib/not-implemented';
import type { Company, ClientProfile, ScreenResult } from '@/lib/schemas';

/** Agent (b): stage 1 sector/activity screen + bucket summaries. Owner: orchestration. */
export async function runScreen(_profile: ClientProfile, _universe: Company[]): Promise<ScreenResult> {
  throw new NotImplementedError('screen agent');
}
