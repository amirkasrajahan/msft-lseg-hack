import { sessionRoute } from '@/lib/api';
import { screenApprovalSchema } from '@/lib/schemas';
import { updateSession } from '@/lib/session';

/** POST /api/session/:id/screen/approve  ScreenApproval -> Session (stage becomes 'vet'). */
export const POST = sessionRoute(
  async (session, req) =>
    updateSession(session.id, {
      screenApproval: screenApprovalSchema.parse(await req.json()),
      stage: 'vet',
      // A new approval makes everything after it stale (the client may be revisiting this step).
      vet: undefined,
      vetConfirmation: undefined,
      portfolio: undefined,
      report: undefined,
    }),
  { requires: ['screen'] },
);
