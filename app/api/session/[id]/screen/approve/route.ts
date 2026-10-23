import { sessionRoute } from '@/lib/api';
import { screenApprovalSchema } from '@/lib/schemas';
import { updateSession } from '@/lib/session';

/** POST /api/session/:id/screen/approve  ScreenApproval -> Session (stage becomes 'vet'). */
export const POST = sessionRoute(
  async (session, req) =>
    updateSession(session.id, {
      screenApproval: screenApprovalSchema.parse(await req.json()),
      stage: 'vet',
    }),
  { requires: ['screen'] },
);
