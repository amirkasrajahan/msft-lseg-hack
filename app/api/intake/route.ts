import { NextResponse } from 'next/server';

/**
 * POST /api/intake  (AI SDK UI message stream, used with useChat)
 * Body: { id: sessionId, messages: UIMessage[] }. On finishIntake the agent writes
 * session.profile and sets stage 'screen'. TODO(orchestration): implement agents/intake.ts.
 * Until then the frontend should use persona sessions: POST /api/session { personaId }.
 */
export async function POST() {
  return NextResponse.json({ error: 'Intake agent not implemented yet, use a persona' }, { status: 501 });
}
