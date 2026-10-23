import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sessionSchema, type Session } from './schemas';

const DIR = path.join(process.cwd(), '.data', 'sessions');
const file = (id: string) => path.join(DIR, `${id}.json`);

export async function createSession(init: Partial<Session> = {}): Promise<Session> {
  const session = sessionSchema.parse({ id: randomUUID(), stage: 'intake', ...init });
  await saveSession(session);
  return session;
}

export async function getSession(id: string): Promise<Session | null> {
  try {
    return sessionSchema.parse(JSON.parse(await readFile(file(id), 'utf8')));
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(file(session.id), JSON.stringify(session, null, 2));
}

/** Read-modify-write helper. Throws if the session does not exist. */
export async function updateSession(id: string, patch: Partial<Session>): Promise<Session> {
  const current = await getSession(id);
  if (!current) throw new Error(`Session ${id} not found`);
  const next = sessionSchema.parse({ ...current, ...patch });
  await saveSession(next);
  return next;
}
