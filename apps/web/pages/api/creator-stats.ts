import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Store {
  [pubkey: string]: any;
}

function loadStore(): Store {
  try {
    const p = path.join(process.cwd(), 'scripts', 'creator-stats.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

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
  const store = loadStore();
  const stats = store[pubkey] || { totals: { views: 0, zapsSats: 0, comments: 0, followerDelta: 0, revenueAud: 0 }, dailySeries: [] };
  res.status(200).json(stats);
}
