import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = (req.query.url as string) || '';
  if (!url) {
    res.status(400).send('Missing url');
    return;
  }
  try {
    const upstream = await fetch(url);
    if (!upstream.ok || !(upstream.headers.get('content-type') ?? '').startsWith('image/')) {
      res.status(404).send('Not an image');
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream');
    res.status(200).send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).send('Bad Gateway');
  }
}
