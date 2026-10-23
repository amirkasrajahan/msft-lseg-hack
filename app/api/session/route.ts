import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadJson } from '@/lib/fixtures';
import { clientProfileSchema } from '@/lib/schemas';
import { createSession } from '@/lib/session';

/** POST /api/session  { personaId?: string }  ->  Session. Persona skips intake (demo fallback). */
export async function POST(req: Request) {
  const { personaId } = z
    .object({ personaId: z.string().regex(/^[a-z0-9-]+$/).optional() })
    .parse(await req.json().catch(() => ({})));
  const profile = personaId
    ? await loadJson(`data/personas/${personaId}.json`, clientProfileSchema)
    : undefined;
  return NextResponse.json(await createSession(profile ? { profile, stage: 'screen' } : {}));
}
