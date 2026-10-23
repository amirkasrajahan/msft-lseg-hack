import { NextResponse } from 'next/server';
import { getSession } from './session';
import type { Session } from './schemas';

type Ctx = { params: Promise<{ id: string }> };

/** Wraps a session-scoped route: loads the session, maps errors to JSON responses. */
export function sessionRoute(
  handler: (session: Session, req: Request) => Promise<unknown>,
  opts: { requires?: (keyof Session)[] } = {},
) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const session = await getSession((await ctx.params).id);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      const missing = opts.requires?.filter((k) => session[k] === undefined);
      if (missing?.length) {
        return NextResponse.json({ error: `Session is missing: ${missing.join(', ')}` }, { status: 409 });
      }
      return NextResponse.json(await handler(session, req));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
