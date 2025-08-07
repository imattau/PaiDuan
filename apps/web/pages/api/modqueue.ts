import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'apps', 'web', 'data', 'modqueue.json');

type Report = {
  targetId: string;
  targetKind: 'video' | 'comment';
  reason: string;
  reporterPubKey: string;
  ts: number;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let data: Report[] = [];
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    data = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  if (req.method === 'POST') {
    const report = req.body as Report;
    data.push(report);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const { targetId } = req.body as { targetId: string };
    data = data.filter((r) => r.targetId !== targetId);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).json(data);
}
