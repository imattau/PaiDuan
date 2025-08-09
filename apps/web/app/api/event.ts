import type { NextApiRequest, NextApiResponse } from 'next';
import { analyticsService } from '../../lib/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NEXT_PUBLIC_ANALYTICS !== 'enabled') {
    res.status(204).end();
    return;
  }
  try {
    await analyticsService.post(req.body, {
      'User-Agent': req.headers['user-agent'] || '',
      'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || '',
    });
  } catch (e) {
    // ignore errors
  }
  res.status(204).end();
}
