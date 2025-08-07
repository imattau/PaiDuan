import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NEXT_PUBLIC_ANALYTICS !== 'enabled') {
    res.status(204).end();
    return;
  }
  try {
    await fetch('https://stats.zapstr.app/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.headers['user-agent'] || '',
        'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || '',
      },
      body: JSON.stringify(req.body),
    });
  } catch (e) {
    // ignore errors
  }
  res.status(204).end();
}
