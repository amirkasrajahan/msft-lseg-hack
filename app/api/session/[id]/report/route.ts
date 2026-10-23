import { sessionRoute } from '@/lib/api';
import { updateSession } from '@/lib/session';
import { reportStage } from '@/pipeline';

/** POST /api/session/:id/report -> Session (with .report, stage 'done'). */
export const POST = sessionRoute(
  async (session) => updateSession(session.id, { report: await reportStage(session), stage: 'done' }),
  { requires: ['profile', 'vet', 'portfolio'] },
);
