import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (typeof url !== 'string') {
    res.status(400).end('missing url');
    return;
  }
  try {
    const r = await fetch(url);
    if (!r.ok) {
      res.status(502).end('bad response');
      return;
    }
    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await r.arrayBuffer());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.status(200).send(buffer);
  } catch {
    res.status(500).end('failed to fetch');
  }
}
