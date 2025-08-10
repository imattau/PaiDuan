import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { src } = await req.json();
  if (!src) {
    return NextResponse.json({ error: 'missing src' }, { status: 400 });
  }
  const id = randomUUID();
  const manifest = `https://nostr.media/variants/${id}/manifest.json`;
  return NextResponse.json({ manifest });
}
