import { NextResponse } from 'next/server';
import { loadUniverse } from '@/pipeline';

/** GET /api/companies -> Company[]. The universe (fixtures in mock mode), so the UI can show names and details. */
export async function GET() {
  try {
    return NextResponse.json(await loadUniverse());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
