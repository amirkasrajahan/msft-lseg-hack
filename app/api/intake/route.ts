import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runIntakeTurn, type IntakeMessage } from '@/agents/intake';
import { getSession } from '@/lib/session';

const bodySchema = z.object({ id: z.string(), messages: z.array(z.unknown()) });

/**
 * POST /api/intake  (AI SDK UI message stream, used with useChat)
 * Body: { id: sessionId, messages: UIMessage[] }. When the client confirms the summary, the agent writes
 * session.profile and sets stage 'screen'; the frontend notices by re-reading the session.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Expected { id, messages }' }, { status: 400 });
  if (!(await getSession(parsed.data.id))) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  const stream = createUIMessageStream<IntakeMessage>({
    execute: async ({ writer }) => {
      const { reply, understood } = await runIntakeTurn(parsed.data.id, parsed.data.messages as UIMessage[]);
      writer.write({ type: 'data-understood', data: understood });
      writer.write({ type: 'text-start', id: 'reply' });
      writer.write({ type: 'text-delta', id: 'reply', delta: reply });
      writer.write({ type: 'text-end', id: 'reply' });
    },
    onError: (e) => (e instanceof Error ? e.message : 'Intake failed'),
  });
  return createUIMessageStreamResponse({ stream });
}
