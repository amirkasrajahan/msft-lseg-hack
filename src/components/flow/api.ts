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
