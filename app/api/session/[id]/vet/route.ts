import { sessionRoute } from '@/lib/api';
import { updateSession } from '@/lib/session';
import { vetStage } from '@/pipeline';

/** POST /api/session/:id/vet -> Session (with .vet). Runs stage 2 ethical vetting. */
export const POST = sessionRoute(
  async (session) => updateSession(session.id, { vet: await vetStage(session), stage: 'vet' }),
  { requires: ['profile', 'screen'] },
);
