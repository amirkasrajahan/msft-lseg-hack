import { NotImplementedError } from '@/lib/not-implemented';
import type { ClientProfile, Portfolio, ReportSpec, VetResult } from '@/lib/schemas';

/** Agent (e): composes the report from the component registry. Owner: orchestration. */
export async function runReport(_input: {
  profile: ClientProfile;
  vet: VetResult;
  portfolio: Portfolio;
}): Promise<ReportSpec> {
  throw new NotImplementedError('report agent');
}
