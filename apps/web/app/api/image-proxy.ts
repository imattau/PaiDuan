import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = (req.query.url as string) || '';
  if (!url) {
    res.status(400).send('Missing url');
    return;
  }
  try {
    const upstream = await fetch(url);
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    const arrayBuffer = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(arrayBuffer));
  } catch {
    res.status(502).send('Bad Gateway');
  }
}
