import type { Session } from '@/lib/schemas';

async function parse(res: Response): Promise<Session> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as Session;
}

export const getSession = (id: string) => fetch(`/api/session/${id}`).then(parse);

export const post = (path: string, body?: unknown) =>
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(parse);

/** Plain-English version of an error for the client. Raw messages stay in the server log. */
export function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (/not found/i.test(m)) return 'That session is no longer available. Press Start over to begin again.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Could not reach the server. Check your connection and try again.';
  if (/401|403|api key|unauthor/i.test(m)) return 'The AI service rejected the request. Check the API key and try again.';
  return m || 'Something went wrong. Please try again.';
}
