import { sessionRoute } from '@/lib/api';
import { screenStage } from '@/pipeline';
import { updateSession } from '@/lib/session';

/** POST /api/session/:id/screen -> Session (with .screen). Runs the stage 1 screen. */
export const POST = sessionRoute(
  async (session) => updateSession(session.id, { screen: await screenStage(session), stage: 'screen' }),
  { requires: ['profile'] },
);
