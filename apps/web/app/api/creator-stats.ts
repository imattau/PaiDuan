import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { CreatorStatsStore } from '../../lib/creatorStatsStore';

const store = new CreatorStatsStore(path.join(process.cwd(), 'scripts', 'creator-stats.json'));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pubkey = req.query.pubkey as string;
  const caller = req.headers['x-pubkey'] as string | undefined;
  const admins = (process.env.ADMIN_PUBKEYS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!caller || (caller !== pubkey && !admins.includes(caller))) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const data = store.read();
  const stats =
    data[pubkey] || {
      totals: { views: 0, zapsSats: 0, comments: 0, followerDelta: 0, revenueAud: 0 },
      dailySeries: [],
    };
  res.status(200).json(stats);
}
