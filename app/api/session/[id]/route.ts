import { sessionRoute } from '@/lib/api';

/** GET /api/session/:id -> Session */
export const GET = sessionRoute(async (session) => session);
