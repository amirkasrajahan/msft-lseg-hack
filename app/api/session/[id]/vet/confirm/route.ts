import { sessionRoute } from '@/lib/api';
import { vetConfirmationSchema } from '@/lib/schemas';
import { updateSession } from '@/lib/session';

/** POST /api/session/:id/vet/confirm  VetConfirmation -> Session (stage becomes 'allocate'). */
export const POST = sessionRoute(
  async (session, req) =>
    updateSession(session.id, {
      vetConfirmation: vetConfirmationSchema.parse(await req.json()),
      stage: 'allocate',
    }),
  { requires: ['vet'] },
);
