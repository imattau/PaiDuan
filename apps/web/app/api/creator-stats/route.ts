import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import path from 'path';
import { CreatorStatsStore } from '../../../lib/creatorStatsStore';

const store = new CreatorStatsStore(path.join(process.cwd(), 'scripts', 'creator-stats.json'));

export async function GET(req: NextRequest) {
  const pubkey = req.nextUrl.searchParams.get('pubkey') ?? '';
  const caller = req.headers.get('x-pubkey') ?? undefined;
  const admins = (process.env.ADMIN_PUBKEYS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!caller || (caller !== pubkey && !admins.includes(caller))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const data = store.read();
  const stats =
    data[pubkey] || {
      totals: { views: 0, zapsSats: 0, comments: 0, followerDelta: 0, revenueAud: 0 },
      dailySeries: [],
    };
  return NextResponse.json(stats);
}
