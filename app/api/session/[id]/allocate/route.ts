import { sessionRoute } from '@/lib/api';
import { updateSession } from '@/lib/session';
import { allocateStage } from '@/pipeline';

/** POST /api/session/:id/allocate -> Session (with .portfolio). Runs the finance module. */
export const POST = sessionRoute(
  async (session) =>
    updateSession(session.id, { portfolio: await allocateStage(session), stage: 'report' }),
  { requires: ['profile', 'vet'] },
);
