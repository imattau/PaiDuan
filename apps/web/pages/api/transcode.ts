import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { src } = req.body as { src?: string };
  if (!src) {
    res.status(400).json({ error: 'missing src' });
    return;
  }
  // mock worker – in real setup this would queue a job and return manifest URL
  const id = randomUUID();
  const manifest = `https://nostr.media/variants/${id}/manifest.json`;
  res.status(200).json({ manifest });
}
